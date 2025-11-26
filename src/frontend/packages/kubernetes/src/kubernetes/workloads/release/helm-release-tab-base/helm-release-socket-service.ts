import { Injectable, type OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { of, Subject, type Subscription } from 'rxjs';
import makeWebSocketObservable, { type GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, map, share, switchMap } from 'rxjs/operators';

import { SnackBarService } from '../../../../../../core/src/shared/services/snackbar.service';
import { type AppState, entityCatalog, WrapperRequestActionSuccess } from '../../../../../../store/src/public-api';
import type { EntityRequestAction } from '../../../../../../store/src/types/request.types';
import { kubeEntityCatalog } from '../../../kubernetes-entity-generator';
import { KubernetesPodExpandedStatusHelper } from '../../../services/kubernetes-expanded-state';
import type { BasicKubeAPIResource, KubernetesPod } from '../../../store/kube.types';
import type { KubePaginationAction } from '../../../store/kubernetes.actions';
import type { HelmReleaseGraph, HelmReleasePod, HelmReleaseService } from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';


enum SocketEventTypes {
  PAUSE_TRUE = 20000,
  PAUSE_FALSE = 20001,
}

interface SocketMessage {
  type: SocketEventTypes;
}

interface WebSocketManifestMessage {
  kind: string;
  data: unknown;
  endpointId?: string;
  releaseTitle?: string;
}

@Injectable()
export class HelmReleaseSocketService implements OnDestroy {

  private sub: Subscription;
  private sendToSocket = new Subject<string>();
  public isPaused = false;

  constructor(
    private helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private snackbarService: SnackBarService,
  ) {

  }

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

    const socket$ = makeWebSocketObservable(streamUrl).pipe(catchError((e: Error): import('rxjs').Observable<never> => {
      console.error(
        `Error while connecting to socket: ${JSON.stringify(e)}`
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
      catchError((e: Error): import('rxjs').Observable<never> => {
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
      let messageObj: WebSocketManifestMessage;
      try {
        messageObj = JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        return;
      }
      if (messageObj) {
        if (messageObj.kind === 'ReleasePrefix') {
          prefix = messageObj.data as string;
        } else if (messageObj.kind === 'Graph') {
          const graph: HelmReleaseGraph = (messageObj.data || { nodes: {}, links: [] }) as HelmReleaseGraph;
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
            (manifest as Array<BasicKubeAPIResource & { kind: string }>).forEach((resource: BasicKubeAPIResource & { kind: string }) => {
              const entityType = this.getEntityTypeForResource(resource.kind);
              if (entityType) {
                if (!resources[entityType]) {
                  resources[entityType] = [];
                }
                resources[entityType].push(resource);
              }
            });

            Object.entries(resources).forEach(([entityType, resourcesOfType]) => {
              let action: KubePaginationAction;
              if (entityType === 'pod') {
                resourcesOfType = resourcesOfType || [];
                resourcesOfType = (resourcesOfType as KubernetesPod[]).map((pod: KubernetesPod) =>
                  KubernetesPodExpandedStatusHelper.updatePodWithExpandedStatus(pod)
                ) as BasicKubeAPIResource[];
              }
              action = (kubeEntityCatalog as unknown as Record<string, { actions: { getInWorkload: (endpointGuid: string, namespace: string, releaseTitle: string) => KubePaginationAction } }>)[entityType].actions.getInWorkload(
                this.helmReleaseHelper.endpointGuid,
                this.helmReleaseHelper.namespace,
                this.helmReleaseHelper.releaseTitle
              );
              this.populateList(action, resourcesOfType);
            });
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

  private addResource(action: EntityRequestAction, data: HelmReleaseGraph | WebSocketManifestMessage) {
    const catalogEntity = entityCatalog.getEntity(action);
    const response: {
      entities: Record<string, Record<string, unknown>>;
      result: string[];
    } = {
      entities: {
        [catalogEntity.entityKey]: {
          [action.guid as string]: data
        }
      },
      result: [
        action.guid as string
      ]
    };
    const successWrapper = new WrapperRequestActionSuccess(response, action);
    this.store.dispatch(successWrapper);
  }

  private populateList(action: KubePaginationAction, resources: BasicKubeAPIResource[]) {
    const entity = entityCatalog.getEntity(action);
    const newResources: Record<string, HelmReleasePod | HelmReleaseService> = {};
    resources.forEach((resource: BasicKubeAPIResource) => {
      const newResource = {
        metadata: resource.metadata,
        status: resource.status,
        spec: resource.spec,
        kubeGuid: action.kubeGuid,
        endpointId: action.kubeGuid,
        releaseTitle: this.helmReleaseHelper.releaseTitle,
      } as HelmReleasePod | HelmReleaseService;
      newResource.metadata.kubeId = action.kubeGuid;
      // The service entity from manifest is missing this, but apply here to ensure any others are caught
      newResource.metadata.namespace = this.helmReleaseHelper.namespace;
      const entityId = (action.entity as { getId: (resource: BasicKubeAPIResource) => string }[])[0].getId(resource);
      newResources[entityId] = newResource;
    });

    const releasePods = {
      entities: { [entity.entityKey]: newResources },
      result: Object.keys(newResources)
    };
    const successWrapper = new WrapperRequestActionSuccess(releasePods, action, 'fetch', releasePods.result.length, 1);
    this.store.dispatch(successWrapper);
  }
}
