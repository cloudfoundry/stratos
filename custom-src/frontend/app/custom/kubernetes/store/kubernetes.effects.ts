import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, combineLatest, flatMap, mergeMap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../store/src/types/request.types';
import { environment } from '../../../environments/environment';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesAppsEntityType,
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
  ConfigMap,
  KubernetesConfigMap,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './kube.types';
import {
  GeKubernetesDeployments,
  GET_KUBE_DASHBOARD,
  GET_KUBE_DEPLOYMENT,
  GET_KUBE_POD,
  GET_KUBE_STATEFULSETS,
  GET_KUBERNETES_APP_INFO,
  GET_NAMESPACE_INFO,
  GET_NAMESPACES_INFO,
  GET_NODE_INFO,
  GET_NODES_INFO,
  GET_POD_INFO,
  GET_PODS_IN_NAMESPACE_INFO,
  GET_PODS_ON_NODE_INFO,
  GET_RELEASE_POD_INFO,
  GET_SERVICE_INFO,
  GET_SERVICES_IN_NAMESPACE_INFO,
  GetKubernetesApps,
  GetKubernetesDashboard,
  GetKubernetesNamespace,
  GetKubernetesNamespaces,
  GetKubernetesNode,
  GetKubernetesNodes,
  GetKubernetesPod,
  GetKubernetesPods,
  GetKubernetesPodsInNamespace,
  GetKubernetesPodsOnNode,
  GetKubernetesReleasePods,
  GetKubernetesServices,
  GetKubernetesServicesInNamespace,
  GetKubernetesStatefulSets,
  KubeAction,
  KubePaginationAction,
} from './kubernetes.actions';

export interface KubeDashboardStatus {
  guid: string;
  installed: boolean;
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
  fetchReleasePodsInfo$ = this.actions$.pipe(
    ofType<GetKubernetesReleasePods>(GET_RELEASE_POD_INFO),
    flatMap(action => {
      const nodeEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNodesEntityType);
      return this.processListAction<KubernetesPod>(
        action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        nodeEntityConfig.entityKey,
        getKubeAPIResourceGuid
      );
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

  @Effect()
  fetchKubernetesAppsInfo$ = this.actions$.pipe(
    ofType<GetKubernetesApps>(GET_KUBERNETES_APP_INFO),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers
      };
      const appsEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesAppsEntityType);
      return this.http
        .get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/api/v1/configmaps`, requestArgs)
        .pipe(
          combineLatest(
            this.http.get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/deployments`, requestArgs),
            this.http.get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/statefulsets`, requestArgs)),
          mergeMap(([configMapsResponse, deploymentsResponse, statefulesetResponse]) => {
            const { kubeGuid: kubeId } = action;
            const items = configMapsResponse[kubeId].items as Array<any>;
            const deployments = deploymentsResponse[kubeId].items as Array<KubernetesDeployment>;
            const statefulSets = statefulesetResponse[kubeId].items as Array<any>;

            const getChartName = (name: string, labelName: string): string => {
              // Might not have a label (e.g. Dex)
              const releaseDeployment = deployments.filter(d =>
                d.metadata.labels && d.metadata.labels['app.kubernetes.io/instance'] === name);
              const releaseStatefulSets = statefulSets.filter(d =>
                d.metadata.labels && d.metadata.labels['app.kubernetes.io/instance'] === name);

              if (releaseDeployment.length !== 0) {
                return releaseDeployment[0].metadata.labels[labelName];
              }
              if (releaseStatefulSets.length !== 0) {
                return releaseStatefulSets[0].metadata.labels[labelName];
              }
            };
            const releases = items
              .filter((configMap) => !!configMap.metadata.labels &&
                !!configMap.metadata.labels.NAME &&
                configMap.metadata.labels.OWNER === 'TILLER'
              )
              .map((configMap: KubernetesConfigMap) => ({
                name: configMap.metadata.labels.NAME,
                kubeId,
                createdAt: configMap.metadata.creationTimestamp,
                status: configMap.metadata.labels.STATUS,
                version: configMap.metadata.labels.VERSION,
                chartName: getChartName(configMap.metadata.labels.NAME, 'helm.sh/chart'),
                appVersion: getChartName(configMap.metadata.labels.NAME, 'app.kubernetes.io/version')
              })
              ).reduce((res, app) => {
                const id = `${app.kubeId}-${app.name}`;
                res.entities[appsEntityConfig.entityKey][id] = app;
                if (res.result.indexOf(id) === -1) {
                  res.result.push(id);
                }
                return res;
              }, {
                entities: { [appsEntityConfig.entityKey]: {} },
                result: []
              } as NormalizedResponse);

            return [
              new WrapperRequestActionSuccess(releases, action)
            ];
          }),
          catchError(error => [
            new WrapperRequestActionFailed(error.message, action, 'fetch', {
              endpointIds: [action.kubeGuid],
              url: error.url || `/pp/${this.proxyAPIVersion}/proxy/api/v1/configmaps`,
              eventCode: error.status ? error.status + '' : '500',
              message: 'Kubernetes API request error',
              error
            })
          ])
        );
    })
  );


  private processNodeAction(action: GetKubernetesReleasePods | GetKubernetesNodes) {
    const nodeEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, kubernetesNodesEntityType);
    return this.processListAction<KubernetesNode>(action,
      `/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes`,
      nodeEntityConfig.entityKey,
      getKubeAPIResourceGuid);
  }


  private processListAction<T>(
    action: KubePaginationAction | KubeAction,
    url: string,
    entityKey: string,
    getId: GetID<T>,
    filterResults?: Filter<T>) {
    this.store.dispatch(new StartRequestAction(action));
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
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
    return this.http
      .get(url, requestArgs)
      .pipe(mergeMap(response => {
        const base = {
          entities: { [entityKey]: {} },
          result: []
        } as NormalizedResponse;
        const items = response[action.kubeGuid].items as Array<any>;
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
      }), catchError(error => [
        new WrapperRequestActionFailed(error.message, action, 'fetch', {
          endpointIds: [action.kubeGuid],
          url: error.url || url,
          eventCode: error.status ? error.status + '' : '500',
          message: 'Kubernetes API request error',
          error
        })
      ]));
  }

  private processSingleItemAction<T>(action: KubeAction, url: string, schemaKey: string, getId: GetID<T>) {
    this.store.dispatch(new StartRequestAction(action));
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
    const requestArgs = {
      headers
    };
    return this.http
      .get(url, requestArgs)
      .pipe(mergeMap(response => {
        const base = {
          entities: { [schemaKey]: {} },
          result: []
        } as NormalizedResponse;
        const items = [response[action.kubeGuid]];
        const processesData = items.reduce((res, data) => {
          const id = getId(data);
          res.entities[schemaKey][id] = data;
          res.result.push(id);
          return res;
        }, base);
        return [
          new WrapperRequestActionSuccess(processesData, action)
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
  }

}
