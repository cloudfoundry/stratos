import { type Injector, signal, type WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf, Subject, type Subscription } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, combineLatest, filter, first, map, mergeMap, share, switchMap, tap } from 'rxjs/operators';

import type { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { organizationEntityType, spaceEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { selectCfEntity } from '../../../../../cloud-foundry/src/store/selectors/api.selectors';
import { selectDeployAppState } from '../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import {
  type AppData,
  type DeployApplicationSource,
  type DeployApplicationState,
  type OverrideAppDetails,
  SocketEventTypes,
} from '../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { environment } from '@stratosui/core';
import type { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import type { FileScannerInfo } from './deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DEPLOY_TYPES_IDS } from './deploy-application-steps.types';

interface WebSocketMessage {
  type: SocketEventTypes;
  message: string;
  timestamp?: number;
}

// Helper function to create a signal wrapper compatible with BehaviorSubject API
// The wrapper provides BehaviorSubject-like API (.next, .getValue, .asObservable)
// while being backed by a Signal for fine-grained reactivity
function createSignalWrapper<T>(initialValue: T, injector: Injector) {
  const _signal = signal<T>(initialValue);
  // Create the observable once during initialization, outside of any reactive context
  // This prevents NG0602 errors when asObservable() is called from reactive contexts
  const _observable = toObservable(_signal, { injector });

  const wrapper = Object.assign(
    // Make it callable like a signal
    () => _signal(),
    {
      // WritableSignal methods
      set: (value: T) => _signal.set(value),
      update: (fn: (value: T) => T) => _signal.update(fn),
      asReadonly: () => _signal.asReadonly(),
      // BehaviorSubject compatibility methods
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => _observable,
    }
  );
  return wrapper as WritableSignal<T> & {
    next: (value: T) => void;
    getValue: () => T;
    asObservable: () => Observable<T>;
  };
}

export interface DeployApplicationDeployerStatus {
  error: boolean;
  errorMsg?: string;
  deploying: boolean;
}

export interface FileTransferStatus {
  totalFiles: number;
  filesSent: number;
  bytesSent: number;
  totalBytes: number;
  fileName: string;
}

interface DeploySource {
  type: string;
}

interface GitSCMSourceInfo extends DeploySource {
  project: string;
  branch: string;
  url: string;
  commit: string;
  scm: string;
  endpointGuid: string;
}

// Structure used to provide metadata about the Git Url source
interface GitUrlSourceInfo extends DeploySource {
  branch: string;
  url: string;
}

// DockerImageSourceInfo - Structure used to provide metadata about the docker source
interface DockerImageSourceInfo extends DeploySource {
  applicationName: string;
  dockerImage: string;
  dockerUsername: string;
}

interface FolderSourceInfo extends DeploySource {
  wait: boolean;
  files: number;
  folders: string[];
}

export class DeployApplicationDeployer {

  isRedeploy!: string;
  connectSub!: Subscription;
  updateSub!: Subscription;
  msgSub!: Subscription;
  streamTitle = 'Preparing...';
  appData: AppData;
  proxyAPIVersion = environment.proxyAPIVersion;
  cfGuid!: string;
  orgGuid!: string;
  spaceGuid!: string;
  applicationSource: DeployApplicationSource | FileScannerInfo | null = null;
  applicationOverrides!: OverrideAppDetails;

  // Signal wrappers with BehaviorSubject-compatible API for backward compatibility
  // These provide both Signal reactivity and Observable API via .asObservable()
  status$: ReturnType<typeof createSignalWrapper<DeployApplicationDeployerStatus>>;

  // Observable on the application GUID of the application being deployed
  applicationGuid$: ReturnType<typeof createSignalWrapper<string | null>>;

  // Status of file transfers
  fileTransferStatus$: ReturnType<typeof createSignalWrapper<FileTransferStatus | undefined>>;

  public messages: ReturnType<typeof createSignalWrapper<string>>;

  // Are we deploying?
  deploying = false;

  private inputStream: Subject<string | ArrayBuffer>;

  private isOpen = false;

  public fsFileInfo!: FileScannerInfo;

  private fileTransfers: Array<File & { fullPath: string }> = [];
  private fileTransferStatus!: FileTransferStatus;
  private currentFileTransfer: File & { fullPath: string } | undefined;

  constructor(
    private store: Store,
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private injector: Injector,
  ) {
    this.status$ = createSignalWrapper<DeployApplicationDeployerStatus>({
      error: false,
      deploying: false
    }, this.injector);

    this.applicationGuid$ = createSignalWrapper<string | null>(null, this.injector);

    this.fileTransferStatus$ = createSignalWrapper<FileTransferStatus | undefined>(undefined, this.injector);

    this.messages = createSignalWrapper<string>('', this.injector);
  }

  updateStatus(error = false, errorMsg?: string) {
    this.status$.next({
      error,
      errorMsg,
      deploying: this.deploying
    });
  }

  close() {
    // Unsubscribe from the websocket stream
    if (this.msgSub) {
      this.msgSub.unsubscribe();
    }
    if (this.connectSub) {
      this.connectSub.unsubscribe();
    }
    if (this.updateSub) {
      this.updateSub.unsubscribe();
    }
    this.isOpen = false;
    this.currentFileTransfer = undefined;
  }

  open() {
    if (this.isOpen) {
      return;
    }

    const readyFilter = this.fsFileInfo ?
      () => true :
      (appDetail: DeployApplicationState) => {
        if (!appDetail.applicationSource || !appDetail.applicationOverrides) {
          return;
        }
        return (!!appDetail.applicationSource.gitDetails && !!appDetail.applicationSource.gitDetails.projectName) ||
          (!!appDetail.applicationSource.dockerDetails && !!appDetail.applicationSource.dockerDetails.dockerImage);

      };
    this.isOpen = true;
    this.connectSub = this.store.select(selectDeployAppState).pipe(
      filter((appDetail: DeployApplicationState) => !!appDetail.cloudFoundryDetails && readyFilter(appDetail)),
      mergeMap(appDetails => {
        const orgSubscription = this.store.select(selectCfEntity(organizationEntityType, appDetails.cloudFoundryDetails.org));
        const spaceSubscription = this.store.select(selectCfEntity(spaceEntityType, appDetails.cloudFoundryDetails.space));
        return observableOf(appDetails).pipe(combineLatest(orgSubscription, spaceSubscription));
      }),
      first(),
      tap(([appDetail, org, space]: [DeployApplicationState, any, any]) => {
        this.cfGuid = appDetail.cloudFoundryDetails.cloudFoundry;
        this.orgGuid = appDetail.cloudFoundryDetails.org;
        this.spaceGuid = appDetail.cloudFoundryDetails.space;
        this.applicationSource = appDetail.applicationSource;
        this.applicationOverrides = appDetail.applicationOverrides;
        const host = window.location.host;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const appId = this.isRedeploy ? `&app=${this.isRedeploy}` : '';
        const streamUrl = (
          `${protocol}://${host}/pp/${this.proxyAPIVersion}/${this.cfGuid}/${this.orgGuid}/${this.spaceGuid}/deploy` +
          `?org=${org.entity.name}&space=${space.entity.name}${appId}`
        );

        this.inputStream = new Subject<string | ArrayBuffer>();
        const buffer = websocketConnect(streamUrl)
          .pipe(
            switchMap((get) => get(this.inputStream)),
            catchError((_e: Error): [] => {
              return [];
            }),
            filter(l => !!l),
            map(log => JSON.parse(typeof log === 'string' ? log : new TextDecoder().decode(log as ArrayBuffer))),
            tap((log) => {
              // Deal with control messages
              if (log.type !== SocketEventTypes.DATA) {
                this.processWebSocketMessage(log);
              }
            }),
            filter((log) => log.type === SocketEventTypes.DATA),
            map((log) => log.message),
            share(),
          );

        // Buffer messages until each newline character
        let b = '';
        this.msgSub = buffer.subscribe(m => {
          b = b + m;
          if (b.endsWith('\n')) {
            this.messages.next(b);
            b = '';
          }
        });
      })
    ).subscribe();

    // Watch for updates to the app overrides - use case is app overrides being set after source file/folder upload
    this.updateSub = this.store.select(selectDeployAppState).pipe(
      filter((appDetail: DeployApplicationState) => !!appDetail.cloudFoundryDetails && readyFilter(appDetail)),
      tap((appDetail) => {
        this.applicationOverrides = appDetail.applicationOverrides;
      })
    ).subscribe();
  }

  deploy() {
    // After the source has been sent, acknowledge the wait
    const msg = {
      message: '',
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.SOURCE_WAIT_ACK
    };
    this.inputStream.next(JSON.stringify(msg));
  }

  sendAppOverride = (appOverrides: OverrideAppDetails) => {
    const msg = {
      message: JSON.stringify(appOverrides),
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.OVERRIDES_SUPPLIED
    };
    return JSON.stringify(msg);
  };

  sendProjectInfo = (appSource: DeployApplicationSource) => {
    if (appSource.type.group === 'gitscm') {
      return this.sendGitSCMSourceMetadata(appSource);
    } else if (appSource.type.id === DEPLOY_TYPES_IDS.GIT_URL) {
      return this.sendGitUrlSourceMetadata(appSource);
    } else if (appSource.type.id === DEPLOY_TYPES_IDS.FILE || appSource.type.id === DEPLOY_TYPES_IDS.FOLDER) {
      return this.sendLocalSourceMetadata();
    } else if (appSource.type.id === DEPLOY_TYPES_IDS.DOCKER_IMG) {
      return this.sendDockerImageMetadata(appSource);
    }
    return '';
  };

  sendGitSCMSourceMetadata = (appSource: DeployApplicationSource) => {
    const gitscm: GitSCMSourceInfo = {
      project: appSource.gitDetails.projectName,
      branch: appSource.gitDetails.branch.name,
      type: appSource.type.group,
      commit: appSource.gitDetails.commit,
      url: appSource.gitDetails.url,
      scm: appSource.type.id,
      endpointGuid: appSource.gitDetails.endpointGuid
    };

    const msg = {
      message: JSON.stringify(gitscm),
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.SOURCE_GITSCM
    };
    return JSON.stringify(msg);
  };

  sendGitUrlSourceMetadata = (appSource: DeployApplicationSource) => {
    const gitUrl: GitUrlSourceInfo = {
      url: appSource.gitDetails.projectName,
      branch: appSource.gitDetails.branch.name,
      type: appSource.type.id
    };

    const msg = {
      message: JSON.stringify(gitUrl),
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.SOURCE_GITURL
    };
    return JSON.stringify(msg);
  };

  sendDockerImageMetadata = (appSource: DeployApplicationSource) => {
    const dockerInfo: DockerImageSourceInfo = {
      applicationName: appSource.dockerDetails.applicationName,
      dockerImage: appSource.dockerDetails.dockerImage,
      dockerUsername: appSource.dockerDetails.dockerUsername,
      type: appSource.type.id
    };

    const msg = {
      message: JSON.stringify(dockerInfo),
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.SOURCE_DOCKER_IMG
    };
    return JSON.stringify(msg);
  };

  sendCloseAcknowledgement = () => {
    const msg = {
      message: '{}',
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.CLOSE_ACK
    };
    return JSON.stringify(msg);
  };

  processWebSocketMessage = (log: WebSocketMessage) => {
    switch (log.type) {
      case SocketEventTypes.MANIFEST:
        this.streamTitle = 'Starting deployment...';
        // This info is will be used to retrieve the app Id
        this.appData = JSON.parse(log.message).Applications[0];
        break;
      case SocketEventTypes.APP_GUID_NOTIFY:
        // Notification of the application GUID for the application
        this.applicationGuid$.next(log.message);
        break;
      case SocketEventTypes.EVENT_PUSH_STARTED:
        this.streamTitle = 'Deploying...';
        this.deploying = true;
        this.updateStatus();
        break;
      case SocketEventTypes.EVENT_PUSH_COMPLETED:
        // Done
        this.streamTitle = 'Deployed';
        this.deploying = false;
        this.updateStatus();
        break;
      case SocketEventTypes.CLOSE_SUCCESS:
        // Acknowledge
        this.inputStream.next(this.sendCloseAcknowledgement());
        this.onClose(log, null, null);
        break;
      case SocketEventTypes.CLOSE_INVALID_MANIFEST:
        this.onClose(log, 'Deploy Failed - Invalid manifest!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml was provided.');
        break;
      case SocketEventTypes.CLOSE_NO_MANIFEST:
        this.onClose(log, 'Deploy Failed - No manifest present!',
          'Failed to deploy app! Please make sure that a valid manifest.yaml is present.');
        break;
      case SocketEventTypes.CLOSE_FAILED_CLONE:
        this.onClose(log, 'Deploy Failed - Failed to clone repository!',
          'Failed to deploy app! Please make sure the repository is accessible.');
        break;
      case SocketEventTypes.CLOSE_FAILED_NO_BRANCH:
        this.onClose(log, 'Deploy Failed - Failed to located branch!',
          'Failed to deploy app! Please make sure that the branch exists.');
        break;
      case SocketEventTypes.CLOSE_FAILURE:
      case SocketEventTypes.CLOSE_PUSH_ERROR:
      case SocketEventTypes.CLOSE_NO_SESSION:
      case SocketEventTypes.CLOSE_NO_CNSI:
      case SocketEventTypes.CLOSE_NO_CNSI_USERTOKEN:
        this.onClose(log, 'Deploy Failed!',
          'Failed to deploy app!');
        break;
      case SocketEventTypes.SOURCE_REQUIRED: {
        if ('type' in this.applicationSource) {
          const sourceInfo = this.sendProjectInfo(this.applicationSource);
          if (!sourceInfo) {
            this.onClose(log, 'Deploy Failed - Unknown source type',
              'Failed to deploy the app - unknown source type');
          } else {
            this.inputStream.next(sourceInfo);
          }
        } else {
          this.onClose(log, 'Deploy Failed - Missing source type',
            'Failed to deploy the app - source type not provided');
        }
        break;
      }
      case SocketEventTypes.OVERRIDES_REQUIRED: {
        const overrides = this.sendAppOverride(this.applicationOverrides);
        this.inputStream.next(overrides);
        break;
      }
      case SocketEventTypes.EVENT_CLONED:
      case SocketEventTypes.EVENT_FETCHED_MANIFEST:
        break;
      case SocketEventTypes.SOURCE_FILE_ACK:
        this.sendNextFile();
        break;
      default:
      // noop
    }
  };

  private sendNextFile() {
    // Update for the previous file transfer
    if (this.currentFileTransfer) {
      this.fileTransferStatus.bytesSent += this.currentFileTransfer.size;
      this.fileTransferStatus.filesSent++;
      this.fileTransferStatus$.next(this.fileTransferStatus);
    }

    if (this.fileTransfers.length > 0) {
      const file = this.fileTransfers.shift();

      // Send file metadata
      const msg = {
        message: file.fullPath,
        timestamp: Math.round(Date.now()/ 1000),
        type: SocketEventTypes.SOURCE_FILE
      };

      this.fileTransferStatus.fileName = file.fullPath;
      this.fileTransferStatus$.next(this.fileTransferStatus);

      // Send the file name metadata
      this.inputStream.next(JSON.stringify(msg));

      // Now send the file data as a binary message
      const reader = new FileReader();
      reader.onload = () => {
        this.currentFileTransfer = file;
        const output = reader.result;
        this.inputStream.next(output);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  private onClose(log: WebSocketMessage, title: string | null, errorMsg: string | null) {
    if (title) {
      this.streamTitle = title;
    }
    this.deploying = false;
    this.updateStatus(
      !!errorMsg,
      errorMsg ? errorMsg : undefined
    );
  }

  // File Upload
  sendLocalSourceMetadata() {
    const metadata: { files: Array<File & { fullPath: string }>; folders: string[] } = {
      files: [],
      folders: []
    };

    this.collectFoldersAndFiles(metadata, null, this.fsFileInfo.root);

    this.fileTransfers = metadata.files;
    this.fileTransferStatus = {
      totalFiles: metadata.files.length,
      filesSent: 0,
      bytesSent: 0,
      totalBytes: this.fsFileInfo.total,
      fileName: ''
    };

    this.fileTransferStatus$.next(this.fileTransferStatus);

    const transferMetadata: FolderSourceInfo = {
      files: metadata.files.length,
      folders: metadata.folders,
      type: 'filefolder',
      wait: true
    };

    // Send the source metadata
    return JSON.stringify({
      message: JSON.stringify(transferMetadata),
      timestamp: Math.round(Date.now()/ 1000),
      type: SocketEventTypes.SOURCE_FOLDER
    });
  }

  // Flatten files and folders
  collectFoldersAndFiles(
    metadata: { files: Array<File & { fullPath: string }>; folders: string[] },
    base: string | null,
    folder: { files?: File[]; folders?: Record<string, { files?: File[]; folders?: Record<string, unknown> }> }
  ) {
    if (folder.files) {
      folder.files.forEach((file: File) => {
        const fileWithPath = file as File & { fullPath: string };
        fileWithPath.fullPath = base ? `${base}/${file.name}` : file.name;
        metadata.files.push(fileWithPath);
      });
    }

    if (folder.folders) {
      Object.keys(folder.folders).forEach(name => {
        const sub = folder.folders?.[name];
        const fullPath = base ? `${base}/${name}` : name;
        metadata.folders.push(fullPath);
        if (sub) {
          this.collectFoldersAndFiles(metadata, fullPath, sub);
        }
      });
    }
  }

}
