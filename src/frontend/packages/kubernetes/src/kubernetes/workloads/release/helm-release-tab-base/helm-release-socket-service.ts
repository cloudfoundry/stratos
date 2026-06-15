import { Injectable, OnDestroy, inject } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, share, switchMap } from 'rxjs/operators';

import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import {
  KubeJobDataService, KubePersistentVolumeClaimDataService, KubeReplicaSetDataService,
  KubeRoleDataService, KubeSecretDataService, KubeServiceAccountDataService,
} from '../../../../services/domain-data/kube-generic-resource-data.services';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../../../services/domain-data/kube-service-data.service';
import { BasicKubeAPIResource } from '../../../store/kube.types';
import { HelmReleaseGraph, HelmReleaseResources } from '../../workload.types';
import { HelmReleaseDataService } from '../helm-release-data.service';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';


enum SocketEventTypes {
  PAUSE_TRUE = 20000,
  PAUSE_FALSE = 20001,
}

interface SocketMessage {
  type: SocketEventTypes;
}

@Injectable()
export class HelmReleaseSocketService implements OnDestroy {
  private helmReleaseHelper = inject(HelmReleaseHelperService);
  private releaseData = inject(HelmReleaseDataService);
  private snackbarService = inject(SnackBarService);
  private podData = inject(KubePodDataService);
  private serviceData = inject(KubeServiceDataService);
  private jobData = inject(KubeJobDataService);
  private secretData = inject(KubeSecretDataService);
  private pvcData = inject(KubePersistentVolumeClaimDataService);
  private replicaSetData = inject(KubeReplicaSetDataService);
  private roleData = inject(KubeRoleDataService);
  private serviceAccountData = inject(KubeServiceAccountDataService);


  private sub?: Subscription;
  private sendToSocket = new Subject<any>();
  public isPaused = false;

  public start() {
    if (this.isStarted()) {
      return;
    }

    const releaseRef = this.helmReleaseHelper.guidAsUrlFragment();
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const streamUrl = (
      `${protocol}://${host}/pp/v1/helm/releases/${releaseRef}/status`
    );

    const socket$ = makeWebSocketObservable(streamUrl).pipe(catchError((e: any): import('rxjs').Observable<never> => {
      console.error(
        'Error while connecting to socket: ' + JSON.stringify(e)
      );
      return of([]) as unknown as import('rxjs').Observable<never>;
    }),
      share(),
    );

    const messages = socket$.pipe(
      switchMap((getResponses: GetWebSocketResponses) => {
        // getResponses emits the raw WebSocket payload (string | ArrayBuffer
        // | Blob); the JSON.parse path below only handles string frames.
        return getResponses(this.sendToSocket);
      }),
      catchError((e: any): import('rxjs').Observable<never> => {
        console.error('Workload WS error: ', e);
        return of([]) as unknown as import('rxjs').Observable<never>;
      })
    );

    let prefix = '';
    this.sub = messages.subscribe((message) => {
      // Guard against empty, invalid, or non-string data
      if (!message || typeof message !== 'string' || message.trim() === '') {
        return;
      }
      const jsonString: string = message;
      let messageObj;
      try {
        messageObj = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        return;
      }
      if (messageObj) {
        if (messageObj.kind === 'ReleasePrefix') {
          prefix = messageObj.data;
        } else if (messageObj.kind === 'Graph') {
          this.writeReleaseGraph(messageObj.data);
        } else if (messageObj.kind === 'Manifest' || messageObj.kind === 'Resources') {
          // Store all of the services
          const manifest = messageObj.data;
          const resources: { [type: string]: BasicKubeAPIResource[]; } = {};

          // Store ALL resources for the release
          if (prefix) {
            manifest.forEach((resource: any) => {
              const entityType = this.getEntityTypeForResource(resource.kind);
              if (entityType) {
                if (!resources[entityType]) {
                  resources[entityType] = [];
                }
                resources[entityType].push(resource);
              }
            });

            this.writeManifestResources(resources);
          }

          // kind === 'Resources' is an array, really they should go into a pagination section
          this.writeReleaseResources(messageObj);
        } else if (messageObj.kind === 'ManifestErrors') {
          if (messageObj.data) {
            this.snackbarService.show('Errors were found when parsing this workload. Not all resources may be shown', 'Dismiss');
          }
        }
      }
    });
  }

  /**
   * Convert type in kube api kind string to kube entity catalog property name
   */
  private getEntityTypeForResource(type: string): string | undefined {
    // TODO: Ideally this should come from some kubeEntityCatalog.allKubeEntities `def.apiName === resource.kind && def.apiWorkspaced`
    // lookup, however we don't currently have anything in the entity that matches the catalog property name
    // (apiName casing doesn't match). We should improve the whole kubeEntityCatalog[entityType] process
    switch (type) {
      case 'Service':
        return 'service';
      case 'Pod':
        return 'pod';
      case 'Job':
        return 'job';
      case 'PersistentVolumeClaim':
        return 'pvc';
      case 'ReplicaSet':
        return 'replicaSet';
      case 'Role':
        return 'role';
      case 'Secret':
        return 'secrets';
      case 'ServiceAccount':
        return 'serviceAccount';
    }
    return undefined;
  }

  public stop() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  public enable(enable: boolean) {
    if (enable) {
      this.start();
    } else {
      this.stop();
    }
  }

  public isStarted(): boolean {
    return !!this.sub;
  }

  public pause(pause: boolean) {
    if (pause !== this.isPaused) {
      const message: SocketMessage = {
        type: pause ? SocketEventTypes.PAUSE_TRUE : SocketEventTypes.PAUSE_FALSE
      };
      this.sendToSocket.next(JSON.stringify(message));
      this.isPaused = pause;
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.snackbarService.hide();
  }

  // Write the socket-streamed release graph into the signal data service
  // (replaces the legacy `WrapperRequestActionSuccess` dispatch into the
  // ngrx `graph` entity-catalog).
  protected writeReleaseGraph(data: any): void {
    const graph: HelmReleaseGraph = data;
    graph.endpointId = this.helmReleaseHelper.endpointGuid;
    graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
    this.releaseData.setGraph(this.helmReleaseHelper.guid, graph);
  }

  // Write the socket-streamed release resources message into the signal data
  // service (replaces the legacy `resource` entity-catalog dispatch).
  protected writeReleaseResources(messageObj: any): void {
    messageObj.endpointId = this.helmReleaseHelper.endpointGuid;
    messageObj.releaseTitle = this.helmReleaseHelper.releaseTitle;
    this.releaseData.setResources(this.helmReleaseHelper.guid, messageObj as HelmReleaseResources);
  }

  // Push each manifest resource group into the matching signal-native
  // domain service under the release's workload scope. Replaces the legacy
  // per-type ngrx `getInWorkload` pagination dispatch.
  protected writeManifestResources(resources: { [type: string]: BasicKubeAPIResource[] }): void {
    const guid = this.helmReleaseHelper.endpointGuid;
    const ns = this.helmReleaseHelper.namespace;
    const rel = this.helmReleaseHelper.releaseTitle;
    Object.entries(resources).forEach(([type, list]) => {
      // Stamp the release namespace onto every row — manifest entities
      // (notably Services) often omit metadata.namespace, and all release
      // resources live in the release's namespace. (Restores the stamp the
      // legacy populateList performed.)
      const items = (list ?? []).map((r: any) => ({
        ...r,
        metadata: { ...(r?.metadata ?? {}), namespace: ns },
      }));
      switch (type) {
        case 'pod': this.podData.setWorkloadPods(guid, ns, rel, items); break;
        case 'service': this.serviceData.setWorkloadServices(guid, ns, rel, items); break;
        case 'job': this.jobData.setWorkloadItems(guid, ns, rel, items); break;
        case 'secrets': this.secretData.setWorkloadItems(guid, ns, rel, items); break;
        case 'pvc': this.pvcData.setWorkloadItems(guid, ns, rel, items); break;
        case 'replicaSet': this.replicaSetData.setWorkloadItems(guid, ns, rel, items); break;
        case 'role': this.roleData.setWorkloadItems(guid, ns, rel, items); break;
        case 'serviceAccount': this.serviceAccountData.setWorkloadItems(guid, ns, rel, items); break;
      }
    });
  }
}
