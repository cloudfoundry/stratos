import {
  kubernetesNodesSchemaKey,
  kubernetesNamespacesSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
  kubernetesDeploymentsSchemaKey,
  kubernetesStatefulSetsSchemaKey,
  kubernetesAppsSchemaKey
} from './kubernetes.entities';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap, combineLatest } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AppState } from '../../../../../store/src/app-state';
import { NormalizedResponse } from '../../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../../store/src/types/request.types';
import {
  KubernetesConfigMap,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
  ConfigMap,
} from './kube.types';
import {
  GeKubernetesDeployments,
  GET_KUBE_DEPLOYMENT,
  GET_KUBE_POD,
  GET_KUBE_STATEFULSETS,
  GET_KUBERNETES_APP_INFO,
  GET_NAMESPACES_INFO,
  GET_NODE_INFO,
  GET_POD_INFO,
  GET_SERVICE_INFO,
  GetKubernetesApps,
  GetKubernetesNamespaces,
  GetKubernetesNodes,
  GetKubernetesPod,
  GetKubernetesPods,
  GetKubernetesServices,
  GetKubernetesStatefulSets,
  KubeAction,
  GET_NODES_INFO,
  GetKubernetesNode,
  GetKubernetesPodsOnNode,
  GET_PODS_ON_NODE_INFO,
  KubePaginationAction,
  GetKubernetesReleasePods,
  GET_RELEASE_POD_INFO,
  GetKubernetesNamespace,
  GET_NAMESPACE_INFO,
  GetKubernetesPodsInNamespace,
  GET_PODS_IN_NAMESPACE_INFO,
} from './kubernetes.actions';

export type GetID<T> = (p: T) => string;
export type Filter<T> = (p: T) => boolean;

@Injectable()
export class KubernetesEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  fetchReleasePodsInfo$ = this.actions$.ofType<GetKubernetesReleasePods>(GET_RELEASE_POD_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesPod> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesPod>(
        action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        kubernetesNodesSchemaKey,
        getUid
      );
    })
  );

  @Effect()
  fetchNodesInfo$ = this.actions$.ofType<GetKubernetesNodes>(GET_NODES_INFO).pipe(
    flatMap(action => {
      return this.processNodeAction(action);
    })
  );

  @Effect()
  fetchNodeInfo$ = this.actions$.ofType<GetKubernetesNode>(GET_NODE_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesNode> = (p) => p.metadata.name;
      return this.processSingleItemAction<KubernetesNode>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes/${action.nodeName}`,
        kubernetesNodesSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchNamespaceInfo$ = this.actions$.ofType<GetKubernetesNamespace>(GET_NAMESPACE_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesNamespace> = (p) => p.metadata.name;
      return this.processSingleItemAction<KubernetesNamespace>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}`,
        kubernetesNamespacesSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchPodsInfo$ = this.actions$.ofType<GetKubernetesPods>(GET_POD_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesPod> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        kubernetesPodsSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchPodsOnNodeInfo$ = this.actions$.ofType<GetKubernetesPodsOnNode>(GET_PODS_ON_NODE_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesPod> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`,
        kubernetesPodsSchemaKey,
        getUid
      );
    })
  );

  @Effect()
  fetchPodsInNamespaceInfo$ = this.actions$.ofType<GetKubernetesPodsInNamespace>(GET_PODS_IN_NAMESPACE_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesPod> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/pods`,
        kubernetesPodsSchemaKey,
        getUid
      );
    })
  );

  @Effect()
  fetchPodInfo$ = this.actions$.ofType<GetKubernetesPod>(GET_KUBE_POD).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesPod> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesPod>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/pods/${action.podName}`,
        kubernetesPodsSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchServicesInfo$ = this.actions$.ofType<GetKubernetesServices>(GET_SERVICE_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubeService> = (p) => p.metadata.uid;
      return this.processListAction<KubeService>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/services`,
        kubernetesServicesSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchNamespacesInfo$ = this.actions$.ofType<GetKubernetesNamespaces>(GET_NAMESPACES_INFO).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesNamespace> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesNamespace>(action,
        `/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces`,
        kubernetesNamespacesSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchStatefulSets$ = this.actions$.ofType<GetKubernetesStatefulSets>(GET_KUBE_STATEFULSETS).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesStatefulSet> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesStatefulSet>(action,
        `/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/statefulsets`,
        kubernetesStatefulSetsSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchDeployments$ = this.actions$.ofType<GeKubernetesDeployments>(GET_KUBE_DEPLOYMENT).pipe(
    flatMap(action => {
      const getUid: GetID<KubernetesDeployment> = (p) => p.metadata.uid;
      return this.processListAction<KubernetesDeployment>(action,
        `/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/deployments`,
        kubernetesDeploymentsSchemaKey,
        getUid);
    })
  );

  @Effect()
  fetchKubernetesAppsInfo$ = this.actions$.ofType<GetKubernetesApps>(GET_KUBERNETES_APP_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/api/v1/configmaps`, requestArgs)
        .pipe(
          combineLatest(
            this.http.get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/deployments`, requestArgs),
            this.http.get<ConfigMap>(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/statefulsets`, requestArgs)),
          mergeMap(([configMapsResponse, deploymentsResponse, statefulesetResponse]) => {
            const id = action.kubeGuid;
            const items = configMapsResponse[id].items as Array<any>;
            const deployments = deploymentsResponse[id].items as Array<KubernetesDeployment>;
            const statefulSets = statefulesetResponse[id].items as Array<any>;

            const getChartName = (name: string, labelName: string): string => {
              const releaseDeployment = deployments.filter(d => d.metadata.labels['app.kubernetes.io/instance'] === name);
              const releaseStatefulSets = statefulSets.filter(d => d.metadata.labels['app.kubernetes.io/instance'] === name);

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
                kubeId: action.kubeGuid,
                createdAt: configMap.metadata.creationTimestamp,
                status: configMap.metadata.labels.STATUS,
                version: configMap.metadata.labels.VERSION,
                chartName: getChartName(configMap.metadata.labels.NAME, 'helm.sh/chart'),
                appVersion: getChartName(configMap.metadata.labels.NAME, 'app.kubernetes.io/version')
              })
              ).reduce((res, app) => {
                const _id = `${app.kubeId}-${app.name}`;
                res.entities[kubernetesAppsSchemaKey][_id] = app;
                if (res.result.indexOf(_id) === -1) {
                  res.result.push(_id);
                }
                return res;
              }, {
                entities: { [kubernetesAppsSchemaKey]: {} },
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
    const getUid: GetID<KubernetesNode> = (p) => p.metadata.uid;
    return this.processListAction<KubernetesNode>(action,
      `/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes`,
      kubernetesNodesSchemaKey,
      getUid);
  }


  private processListAction<T>(
    action: KubePaginationAction | KubeAction,
    url: string, schemaKey: string,
    getId: GetID<T>,
    filterResults?: Filter<T>) {
    this.store.dispatch(new StartRequestAction(action));
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
    const requestArgs = {
      headers: headers,
      params: null
    };
    const paginationAction = action as KubePaginationAction;
    if (paginationAction.initialParams) {
      requestArgs.params = Object.keys(paginationAction.initialParams).reduce((httpParams, initialKey: string) => {
        return httpParams.set(initialKey, paginationAction.initialParams[initialKey]);
      }, new HttpParams());
    }
    return this.http
      .get(url, requestArgs)
      .pipe(mergeMap(response => {
        const base = {
          entities: { [schemaKey]: {} },
          result: []
        } as NormalizedResponse;
        const items = response[action.kubeGuid].items as Array<any>;
        const processesData = items.filter((res) => !!filterResults ? filterResults(res) : true)
          .reduce((res, data) => {
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

  private processSingleItemAction<T>(action: KubeAction, url: string, schemaKey: string, getId: GetID<T>) {
    this.store.dispatch(new StartRequestAction(action));
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': action.kubeGuid });
    const requestArgs = {
      headers: headers
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
