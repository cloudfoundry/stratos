import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { ClearPaginationOfType } from 'frontend/packages/store/src/actions/pagination.actions';
import { ApiRequestTypes } from 'frontend/packages/store/src/reducers/api-request-reducer/request-helpers';
import { connectedEndpointsOfTypesSelector } from 'frontend/packages/store/src/selectors/endpoint.selectors';
import { of } from 'rxjs';
import { catchError, first, flatMap, map, mergeMap, switchMap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../store/src/types/request.types';
import { environment } from '../../../environments/environment';
import { isJetstreamError } from '../../../jetstream.helpers';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesDashboardEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesNamespacesEntityType,
  kubernetesNodesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from '../kubernetes-entity-factory';
import { getKubeAPIResourceGuid } from './kube.selectors';
import {
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './kube.types';
import {
  CREATE_NAMESPACE,
  CreateKubernetesNamespace,
  GeKubernetesDeployments,
  GET_KUBE_DASHBOARD,
  GET_KUBE_DEPLOYMENT,
  GET_KUBE_POD,
  GET_KUBE_STATEFULSETS,
  GET_NAMESPACE_INFO,
  GET_NAMESPACES_INFO,
  GET_NODE_INFO,
  GET_NODES_INFO,
  GET_POD_INFO,
  GET_PODS_IN_NAMESPACE_INFO,
  GET_PODS_ON_NODE_INFO,
  GET_SERVICE_INFO,
  GET_SERVICES_IN_NAMESPACE_INFO,
  GetKubernetesDashboard,
  GetKubernetesNamespace,
  GetKubernetesNamespaces,
  GetKubernetesNode,
  GetKubernetesNodes,
  GetKubernetesPod,
  GetKubernetesPods,
  GetKubernetesPodsInNamespace,
  GetKubernetesPodsOnNode,
  GetKubernetesServices,
  GetKubernetesServicesInNamespace,
  GetKubernetesStatefulSets,
  KubeAction,
  KubePaginationAction,
} from './kubernetes.actions';

export interface KubeDashboardContainer {
  name: string;
  image: string;
}

export interface KubeDashboardStatus {
  guid: string;
  installed: boolean;
  stratosInstalled: boolean;
  running: boolean;
  pod: {
    spec: {
      containers: KubeDashboardContainer[]
    }
  };
  version: string;
  service: {
    namespace: string;
    name: string;
    scheme: string;
  };
  serviceAccount: any;
}

type GetID<T> = (p: T) => string;
type Filter<T> = (p: T) => boolean;

@Injectable()
export class KubernetesEffects {
  proxyAPIVersion = environment.proxyAPIVersion;

  constructor(private http: HttpClient, private actions$: Actions, private store: Store<AppState>) { }

  @Effect()
  fetchDashboardInfo$ = this.actions$.pipe(
    ofType<GetKubernetesDashboard>(GET_KUBE_DASHBOARD),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers
      };
      const url = `/pp/${this.proxyAPIVersion}/kubedash/${action.kubeGuid}/status`;
      const dashboardEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesDashboardEntityType);
      return this.http
        .get(url, requestArgs)
        .pipe(mergeMap(response => {
          const result = {
            entities: { [dashboardEntityConfig.entityKey]: {} },
            result: []
          } as NormalizedResponse;
          const status = response as KubeDashboardStatus;
          const id = status.guid;
          result.entities[dashboardEntityConfig.entityKey][id] = status;
          result.result.push(id);
          return [
            new WrapperRequestActionSuccess(result, action)
          ];
        }), catchError(error => [
          new WrapperRequestActionFailed(error.message, action, 'fetch', {
            endpointIds: [action.kubeGuid],
            url: error.url || url,
            eventCode: error.status ? error.status + '' : '500',
            message: 'Kubernetes API request error',
            error
          })
        ]));
    })
  );

  @Effect()
  fetchNodesInfo$ = this.actions$.pipe(
    ofType<GetKubernetesNodes>(GET_NODES_INFO),
    flatMap(action => this.processNodeAction(action))
  );

  @Effect()
  fetchNodeInfo$ = this.actions$.pipe(
    ofType<GetKubernetesNode>(GET_NODE_INFO),
    flatMap(action => {
      const nodeEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNodesEntityType);
      return this.processSingleItemAction<KubernetesNode>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes/${action.nodeName}`,
        nodeEntityConfig.entityKey,
        (node) => node.metadata.name);
    })
  );

  @Effect()
  fetchNamespaceInfo$ = this.actions$.pipe(
    ofType<GetKubernetesNamespace>(GET_NAMESPACE_INFO),
    flatMap(action => {
      const namespaceEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNamespacesEntityType);
      return this.processSingleItemAction<KubernetesNamespace>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}`,
        namespaceEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  @Effect()
  fetchPodsInfo$ = this.actions$.pipe(
    ofType<GetKubernetesPods>(GET_POD_INFO),
    flatMap(action => {
      const podsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType);
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        podsEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  @Effect()
  fetchPodsOnNodeInfo$ = this.actions$.pipe(
    ofType<GetKubernetesPodsOnNode>(GET_PODS_ON_NODE_INFO),
    flatMap(action => {
      const podsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType);
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        podsEntityConfig.entityKey,
        getKubeAPIResourceGuid
      );
    })
  );

  @Effect()
  fetchPodsInNamespaceInfo$ = this.actions$.pipe(
    ofType<GetKubernetesPodsInNamespace>(GET_PODS_IN_NAMESPACE_INFO),
    flatMap(action => {
      const podsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType);
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/pods`,
        podsEntityConfig.entityKey,
        getKubeAPIResourceGuid
      );
    })
  );

  @Effect()
  fetchServicesInNamespaceInfo$ = this.actions$.pipe(
    ofType<GetKubernetesServicesInNamespace>(GET_SERVICES_IN_NAMESPACE_INFO),
    flatMap(action => {
      const servicesEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesServicesEntityType);
      return this.processListAction<KubeService>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/services`,
        servicesEntityConfig.entityKey,
        getKubeAPIResourceGuid
      );
    })
  );

  @Effect()
  fetchPodInfo$ = this.actions$.pipe(
    ofType<GetKubernetesPod>(GET_KUBE_POD),
    flatMap(action => {
      const podsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesPodsEntityType);
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/pods/${action.podName}`,
        podsEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  @Effect()
  fetchServicesInfo$ = this.actions$.pipe(
    ofType<GetKubernetesServices>(GET_SERVICE_INFO),
    flatMap(action => {
      const servicesEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesServicesEntityType);
      return this.processListAction<KubeService>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/services`,
        servicesEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  @Effect()
  fetchNamespacesInfo$ = this.actions$.pipe(
    ofType<GetKubernetesNamespaces>(GET_NAMESPACES_INFO),
    flatMap(action => {
      const namespaceEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNamespacesEntityType);
      return this.processListAction<KubernetesNamespace>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces`,
        namespaceEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );


  @Effect()
  createNamespace$ = this.actions$.pipe(
    ofType<CreateKubernetesNamespace>(CREATE_NAMESPACE),
    flatMap(action => {
      const namespaceEntityConfig = entityCatalog.getEntity(action);
      return this.processSingleItemAction<KubernetesNamespace>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces`,
        namespaceEntityConfig.entityKey,
        getKubeAPIResourceGuid,
        {
          kind: 'Namespace',
          apiVersion: 'v1',
          metadata: {
            name: action.namespaceName,
          },
        });
    })
  );

  @Effect()
  fetchStatefulSets$ = this.actions$.pipe(
    ofType<GetKubernetesStatefulSets>(GET_KUBE_STATEFULSETS),
    flatMap(action => {
      const statefulSetsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesStatefulSetsEntityType);
      return this.processListAction<KubernetesStatefulSet>(action,
        `/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/statefulsets`,
        statefulSetsEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  @Effect()
  fetchDeployments$ = this.actions$.pipe(
    ofType<GeKubernetesDeployments>(GET_KUBE_DEPLOYMENT),
    flatMap(action => {
      const deploymentsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesDeploymentsEntityType);
      return this.processListAction<KubernetesDeployment>(action,
        `/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/deployments`,
        deploymentsEntityConfig.entityKey,
        getKubeAPIResourceGuid);
    })
  );

  private processNodeAction(action: GetKubernetesNodes) {
    const nodeEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNodesEntityType);
    return this.processListAction<KubernetesNode>(action,
      `/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes`,
      nodeEntityConfig.entityKey,
      getKubeAPIResourceGuid);
  }

  private processListAction<T = any>(
    action: KubePaginationAction | KubeAction,
    url: string,
    entityKey: string,
    getId: GetID<T>,
    filterResults?: Filter<T>) {
    this.store.dispatch(new StartRequestAction(action));

    const getKubeIds = action.kubeGuid ?
      of([action.kubeGuid]) :
      this.store.select(connectedEndpointsOfTypesSelector(KUBERNETES_ENDPOINT_TYPE)).pipe(
        first(),
        map(endpoints => Object.values(endpoints).map(endpoint => endpoint.guid))
      );
    let pKubeIds;

    return getKubeIds.pipe(
      switchMap(kubeIds => {
        pKubeIds = kubeIds;
        const headers = new HttpHeaders({ 'x-cap-cnsi-list': pKubeIds });
        // const headers = hr.headers.set(PipelineHttpClient.EndpointHeader, endpointGuids);
        const requestArgs = {
          headers,
          params: null
        };
        const paginationAction = action as KubePaginationAction;
        if (paginationAction.initialParams) {
          requestArgs.params = Object.keys(paginationAction.initialParams).reduce((httpParams, initialKey: string) => {
            return httpParams.set(initialKey, paginationAction.initialParams[initialKey].toString());
          }, new HttpParams());
        }
        return this.http.get(url, requestArgs);
      }),
      mergeMap(allRes => {
        const base = {
          entities: { [entityKey]: {} },
          result: []
        } as NormalizedResponse;

        const items: Array<T> = Object.entries(allRes).reduce((combinedRes, [kubeId, res]) => {
          if (!res.items) {
            // The request to this endpoint has failed. Note - throwing this hides any other failures,
            // however we follow the same approach elsewhere
            throw res;
          }
          res.items.forEach(item => {
            item.metadata.kubeId = kubeId;
            combinedRes.push(item);
          });
          return combinedRes;
        }, []);
        const processesData = items.filter((res) => !!filterResults ? filterResults(res) : true)
          .reduce((res, data) => {
            const id = getId(data);
            res.entities[entityKey][id] = data;
            res.result.push(id);
            return res;
          }, base);
        return [
          new WrapperRequestActionSuccess(processesData, action)
        ];
      }),
      catchError(error => {
        const { status, message } = this.createKubeError(error);
        return [
          new WrapperRequestActionFailed(message, action, 'fetch', {
            endpointIds: pKubeIds,
            url: error.url || url,
            eventCode: status,
            message,
            error,
          })
        ];
      })
    );
  }

  private processSingleItemAction<T>(action: KubeAction, url: string, schemaKey: string, getId: GetID<T>, body?: any) {
    const requestType: ApiRequestTypes = body ? 'create' : 'fetch';
    this.store.dispatch(new StartRequestAction(action, requestType));
    const headers = new HttpHeaders({
      'x-cap-cnsi-list': action.kubeGuid,
      'x-cap-passthrough': 'true'
    },
    );
    const requestArgs = {
      headers
    };
    const request = body ? this.http.post(url, body, requestArgs) : this.http.get(url, requestArgs);

    return request
      .pipe(
        mergeMap((response: T) => {
          const res = {
            entities: { [schemaKey]: {} },
            result: []
          } as NormalizedResponse;
          const id = getId(response);
          res.entities[schemaKey][id] = response;
          res.result.push(id);
          const actions: Action[] = [
            new WrapperRequestActionSuccess(res, action)
          ];
          if (requestType === 'create') {
            actions.push(new ClearPaginationOfType(action));
          }
          return actions;
        }),
        catchError(error => {
          const { status, message } = this.createKubeError(error);
          return [
            new WrapperRequestActionFailed(message, action, requestType, {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: status,
              message,
              error
            })
          ];
        })
      );
  }

  private createKubeErrorMessage(err: any): string {
    if (err) {
      if (err.error && err.error.message) {
        // Kube error
        return err.error.message;
      } else if (err.message) {
        // Http error
        return err.message;
      }
    }
    return 'Kubernetes API request error';
  }

  private createKubeError(err: any): { status: string, message: string } {
    const jetstreamError = isJetstreamError(err);
    if (jetstreamError) {
      // Wrapped error
      return {
        status: jetstreamError.error.statusCode.toString(),
        message: this.createKubeErrorMessage(jetstreamError.errorResponse)
      };
    }
    return {
      status: err && err.status ? err.status + '' : '500',
      message: this.createKubeErrorMessage(err)
    };
  }
}
