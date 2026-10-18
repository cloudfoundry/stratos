import { EnvironmentInjector, signal } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { take, catchError, filter, map, share, switchMap, tap } from 'rxjs/operators';

import {
  AppData,
  DeployApplicationSource,
  DeployApplicationState,
  OverrideAppDetails,
  SocketEventTypes } from '../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { environment } from '../../../../../core/src/environments/environment.prod';
import { createSignalWrapper, observeSignal } from '@stratosui/store';
import { CfDeployAppDataService } from '../../../services/domain-data/cf-deploy-app-data.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { FileScannerInfo } from './deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DEPLOY_TYPES_IDS } from './deploy-application-steps.types';

// `equal: () => false` on every wrapper below makes each write notify the
// signal too. The deployer mutates state objects in place (e.g.
// fileTransferStatus.filesSent++) and re-emits the same reference; the
// default Object.is dedupe would drop every update after the first and the
// upload progress UI would freeze.
const alwaysNotify = { equal: () => false };

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
  url?: string;
  commit?: string;
  scm: string;
  endpointGuid: string;
  accessToken?: string;
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
  dockerUsername?: string;
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
  streamTitle = signal('Preparing...');
  // strict: populated from the MANIFEST websocket event before any read
  appData!: AppData;
  proxyAPIVersion = environment.proxyAPIVersion;
  cfGuid!: string;
  orgGuid!: string;
  spaceGuid!: string;
  applicationSource: any;
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

  private inputStream: any;

  private deployState$: Observable<DeployApplicationState>;

  private isOpen = false;

  // The backend can follow a specific close message with a generic one;
  // only the first close of a deploy is reported
  private closeReported = false;

  // A remote source deploys as soon as the socket opens; a local source
  // only once deploy() acknowledges the upload
  private started = false;

  // Started, connected and not yet ended by a reported close. A deploy in
  // flight reports its end even after the deploy step is gone; one still
  // waiting to connect never will, as leaving clears its deploy details.
  get inFlight() {
    return this.isOpen && this.started && !!this.msgSub && !this.msgSub.closed && !this.closeReported;
  }

  get finished() {
    return this.closeReported;
  }

  public fsFileInfo!: FileScannerInfo;

  private fileTransfers: any;
  private fileTransferStatus!: FileTransferStatus;
  private currentFileTransfer: any;

  constructor(
    public cfOrgSpaceService: CfOrgSpaceDataService,
    private injector: EnvironmentInjector,
  ) {
    this.status$ = createSignalWrapper<DeployApplicationDeployerStatus>({
      error: false,
      deploying: false
    }, alwaysNotify);

    this.applicationGuid$ = createSignalWrapper<string | null>(null, alwaysNotify);

    this.fileTransferStatus$ = createSignalWrapper<FileTransferStatus | undefined>(undefined, alwaysNotify);

    this.messages = createSignalWrapper<string>('', alwaysNotify);

    // Built once; each subscription runs its own effect and ends it on
    // unsubscribe, so repeated open()/close() leaves nothing behind.
    this.deployState$ = observeSignal(this.injector.get(CfDeployAppDataService).state, this.injector);
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
          return false;
        }
        return (!!appDetail.applicationSource.gitDetails && !!appDetail.applicationSource.gitDetails.projectName) ||
          (!!appDetail.applicationSource.dockerDetails && !!appDetail.applicationSource.dockerDetails.dockerImage);

      };
    this.isOpen = true;
    this.closeReported = false;
    this.started = !this.fsFileInfo;
    this.connectSub = this.deployState$.pipe(
      filter((appDetail): appDetail is DeployApplicationState & { cloudFoundryDetails: NonNullable<DeployApplicationState['cloudFoundryDetails']>; } =>
        !!appDetail && !!appDetail.cloudFoundryDetails && readyFilter(appDetail)),
      take(1),
      tap((appDetail) => {
        this.cfGuid = appDetail.cloudFoundryDetails.cloudFoundry;
        this.orgGuid = appDetail.cloudFoundryDetails.org;
        this.spaceGuid = appDetail.cloudFoundryDetails.space;
        this.applicationSource = appDetail.applicationSource;
        if (appDetail.applicationOverrides) {
          this.applicationOverrides = appDetail.applicationOverrides;
        }
        // Resolve org / space names from the signal-native picker — it
        // already loaded both lists when the user made their selection,
        // so the lookup is synchronous. Replaces the legacy ngrx
        // `selectCfEntity` selectors that the V3 signal-native cutover
        // stopped populating for org / space, which was causing the
        // deployer to crash here on `undefined.entity.name`.
        const orgName = this.cfOrgSpaceService.orgList().find(o => o.guid === this.orgGuid)?.name ?? '';
        const spaceName = this.cfOrgSpaceService.spaceList().find(s => s.guid === this.spaceGuid)?.name ?? '';
        const host = window.location.host;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const appId = this.isRedeploy ? `&app=${this.isRedeploy}` : '';
        const streamUrl = (
          `${protocol}://${host}/pp/${this.proxyAPIVersion}/${this.cfGuid}/${this.orgGuid}/${this.spaceGuid}/deploy` +
          `?org=${encodeURIComponent(orgName)}&space=${encodeURIComponent(spaceName)}${appId}`
        );

        this.inputStream = new Subject<string>();
        const buffer = websocketConnect(streamUrl)
          .pipe(
            switchMap((get) => get(this.inputStream)),
            catchError((_e: any): any[] => {
              return [];
            }),
            filter(l => !!l),
            map(log => JSON.parse(log)),
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
        this.msgSub = buffer.subscribe({
          next: m => {
            b = b + m;
            if (b.endsWith('\n')) {
              this.messages.next(b);
              b = '';
            }
          },
          // The socket ended (errors end it too) without a close message.
          // close() unsubscribes, which does not get here.
          complete: () => this.onClose({}, 'Deploy Failed - Connection lost',
            'The connection to the server was lost before the deploy finished.'),
        });
      })
    ).subscribe();

    // Watch for updates to the app overrides - use case is app overrides being set after source file/folder upload
    this.updateSub = this.deployState$.pipe(
      filter((appDetail): appDetail is DeployApplicationState => !!appDetail && !!appDetail.cloudFoundryDetails && readyFilter(appDetail)),
      tap((appDetail) => {
        if (appDetail.applicationOverrides) {
          this.applicationOverrides = appDetail.applicationOverrides;
        }
      })
    ).subscribe();
  }

  deploy() {
    this.started = true;
    // After the source has been sent, acknowledge the wait
    const msg = {
      message: '',
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_WAIT_ACK
    };
    this.inputStream.next(JSON.stringify(msg));
  }

  sendAppOverride = (appOverrides: OverrideAppDetails) => {
    const msg = {
      message: JSON.stringify(appOverrides),
      timestamp: Math.round((new Date()).getTime() / 1000),
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
    // strict: only reached via sendProjectInfo when type.group === 'gitscm',
    // which the source-type selection guarantees populates gitDetails.
    const gitDetails = appSource.gitDetails!;
    const gitscm: GitSCMSourceInfo = {
      project: gitDetails.projectName,
      branch: gitDetails.branch.name,
      // strict: gitscm branch guarantees type.group === 'gitscm'
      type: appSource.type.group!,
      commit: gitDetails.commit,
      url: gitDetails.url,
      scm: appSource.type.id,
      endpointGuid: gitDetails.endpointGuid,
      accessToken: gitDetails.accessToken,
    };

    const msg = {
      message: JSON.stringify(gitscm),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITSCM
    };
    return JSON.stringify(msg);
  };

  sendGitUrlSourceMetadata = (appSource: DeployApplicationSource) => {
    // strict: only reached via sendProjectInfo when type.id === GIT_URL,
    // which the source-type selection guarantees populates gitDetails.
    const gitDetails = appSource.gitDetails!;
    const gitUrl: GitUrlSourceInfo = {
      url: gitDetails.projectName,
      branch: gitDetails.branch.name,
      type: appSource.type.id
    };

    const msg = {
      message: JSON.stringify(gitUrl),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_GITURL
    };
    return JSON.stringify(msg);
  };

  sendDockerImageMetadata = (appSource: DeployApplicationSource) => {
    // strict: only reached via sendProjectInfo when type.id === DOCKER_IMG,
    // which the source-type selection guarantees populates dockerDetails.
    const dockerDetails = appSource.dockerDetails!;
    const dockerInfo: DockerImageSourceInfo = {
      applicationName: dockerDetails.applicationName,
      dockerImage: dockerDetails.dockerImage,
      dockerUsername: dockerDetails.dockerUsername,
      type: appSource.type.id
    };

    const msg = {
      message: JSON.stringify(dockerInfo),
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_DOCKER_IMG
    };
    return JSON.stringify(msg);
  };

  sendCloseAcknowledgement = () => {
    const msg = {
      message: '{}',
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.CLOSE_ACK
    };
    return JSON.stringify(msg);
  };

  processWebSocketMessage = (log: any) => {
    switch (log.type) {
      case SocketEventTypes.MANIFEST:
        this.streamTitle.set('Starting deployment...');
        // This info is will be used to retrieve the app Id
        this.appData = JSON.parse(log.message).Applications[0];
        break;
      case SocketEventTypes.APP_GUID_NOTIFY:
        // Notification of the application GUID for the application
        this.applicationGuid$.next(log.message);
        break;
      case SocketEventTypes.EVENT_PUSH_STARTED:
        this.streamTitle.set('Deploying...');
        this.deploying = true;
        this.updateStatus();
        break;
      case SocketEventTypes.EVENT_PUSH_COMPLETED:
        // Done
        this.streamTitle.set('Deployed');
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
          'Failed to deploy app! Add a manifest.yml to the source or enter an application name.');
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
        const sourceInfo = this.sendProjectInfo(this.applicationSource);
        if (!sourceInfo) {
          this.onClose(log, 'Deploy Failed - Unknown source type',
            'Failed to deploy the app - unknown source type');
        } else {
          this.inputStream.next(sourceInfo);
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
        timestamp: Math.round((new Date()).getTime() / 1000),
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

  private onClose(log: any, title: string | null, error: any) {
    if (this.closeReported) {
      return;
    }
    this.closeReported = true;
    if (title) {
      this.streamTitle.set(title);
    }
    this.deploying = false;
    this.updateStatus(
      error,
      error && log.message ? `${error}\nReason: ${log.message}` : error || undefined
    );
  }

  // File Upload
  sendLocalSourceMetadata() {
    const metadata: { files: any[]; folders: any[] } = {
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
      timestamp: Math.round((new Date()).getTime() / 1000),
      type: SocketEventTypes.SOURCE_FOLDER
    });
  }

  // Flatten files and folders
  collectFoldersAndFiles(metadata: any, base: string | null, folder: any) {
    if (folder.files) {
      folder.files.forEach((file: any) => {
        file.fullPath = base ? base + '/' + file.name : file.name;
        metadata.files.push(file);
      });
    }

    if (folder.folders) {
      Object.keys(folder.folders).forEach(name => {
        const sub = folder.folders[name];
        const fullPath = base ? base + '/' + name : name;
        metadata.folders.push(fullPath);
        this.collectFoldersAndFiles(metadata, fullPath, sub);
      });
    }
  }

}
