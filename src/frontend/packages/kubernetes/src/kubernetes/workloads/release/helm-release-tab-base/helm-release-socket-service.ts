import { Injectable, OnDestroy, inject } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, map, share, switchMap } from 'rxjs/operators';

import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { AppState, Store, entityCatalog, WrapperRequestActionSuccess } from '../../../../../../store/src/public-api';
import { EntityRequestAction } from '../../../../../../store/src/types/request.types';
import {
  KubeJobDataService, KubePersistentVolumeClaimDataService, KubeReplicaSetDataService,
  KubeRoleDataService, KubeSecretDataService, KubeServiceAccountDataService,
} from '../../../../services/domain-data/kube-generic-resource-data.services';
import { KubePodDataService } from '../../../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../../../services/domain-data/kube-service-data.service';
import { BasicKubeAPIResource } from '../../../store/kube.types';
import { HelmReleaseGraph } from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';
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
  private store = inject<Store<AppState>>(Store);
  private snackbarService = inject(SnackBarService);
  private podData = inject(KubePodDataService);
  private serviceData = inject(KubeServiceDataService);
  private jobData = inject(KubeJobDataService);
  private secretData = inject(KubeSecretDataService);
  private pvcData = inject(KubePersistentVolumeClaimDataService);
  private replicaSetData = inject(KubeReplicaSetDataService);
  private roleData = inject(KubeRoleDataService);
  private serviceAccountData = inject(KubeServiceAccountDataService);


  private sub: Subscription;
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
        return getResponses(this.sendToSocket);
      }),
      map((message: string) => message),
      catchError((e: any): import('rxjs').Observable<never> => {
        console.error('Workload WS error: ', e);
        return of([]) as unknown as import('rxjs').Observable<never>;
      })
    );

    let prefix = '';
    this.sub = messages.subscribe((jsonString: string) => {
      // Guard against empty, invalid, or non-string data
      if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
        return;
      }
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
          const graph: HelmReleaseGraph = messageObj.data;
          graph.endpointId = this.helmReleaseHelper.endpointGuid;
          graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
          const releaseGraphAction = workloadsEntityCatalog.graph.actions.get(graph.releaseTitle, graph.endpointId);
          this.addResource(releaseGraphAction, graph);
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

          // const resources = { ...manifest };
          // kind === 'Resources' is an array, really they should go into a pagination section
          messageObj.endpointId = this.helmReleaseHelper.endpointGuid;
          messageObj.releaseTitle = this.helmReleaseHelper.releaseTitle;

          const releaseResourceAction = workloadsEntityCatalog.resource.actions.get(
            this.helmReleaseHelper.releaseTitle,
            this.helmReleaseHelper.endpointGuid,
          );
          this.addResource(releaseResourceAction, messageObj);
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
      this.sub = null;
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

  private addResource(action: EntityRequestAction, data: any) {
    const catalogEntity = entityCatalog.getEntity(action);
    const response: any = {
      entities: {
        [catalogEntity.entityKey]: {
          [action.guid as string]: data
        }
      },
      result: [
        action.guid
      ]
    };
    const successWrapper = new WrapperRequestActionSuccess(response, action);
    this.store.dispatch(successWrapper);
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
