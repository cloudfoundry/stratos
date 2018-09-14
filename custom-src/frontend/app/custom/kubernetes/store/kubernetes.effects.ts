import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import {
  kubernetesAppsSchemaKey,
  kubernetesNamespacesSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
  kubernetesStatefulSetsSchemaKey,
  kubernetesDeploymentsSchemaKey,
} from '../../../../../../src/frontend/app/store/helpers/entity-factory';
import { environment } from '../../../../environments/environment';
import { AppState } from '../../../store/app-state';
import { kubernetesNodesSchemaKey } from '../../../store/helpers/entity-factory';
import { NormalizedResponse } from '../../../store/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../store/types/request.types';
import { KubernetesPod, KubeService } from './kube.types';
import {
  GET_KUBE_POD,
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
  GET_KUBE_STATEFULSETS,
  GeKubernetesDeployments,
  GET_KUBE_DEPLOYMENT,
} from './kubernetes.actions';


@Injectable()
export class KubernetesEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  fetchNodeInfo$ = this.actions$.ofType<GetKubernetesNodes>(GET_NODE_INFO).pipe(
    flatMap(action => {

      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/nodes`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesNodesSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.kubeGuid;
            mappedData.entities[kubernetesNodesSchemaKey][id] = info[id].items;
            mappedData.result.push(id);
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchPodsInfo$ = this.actions$.ofType<GetKubernetesPods>(GET_POD_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/pods`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesPodsSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            info[action.kubeGuid].items.forEach((p: KubernetesPod) => {
              const id = p.metadata.name;
              p.metadata.kubeId = action.kubeGuid;
              mappedData.entities[kubernetesPodsSchemaKey][id] = p;
              mappedData.result.push(id);

            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchPodInfo$ = this.actions$.ofType<GetKubernetesPod>(GET_KUBE_POD).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces/${action.namespaceName}/pods/${action.podName}`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesPodsSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            info[action.kubeGuid].items.forEach((p: KubernetesPod) => {
              const id = p.metadata.uid;
              p.metadata.kubeId = action.kubeGuid;
              mappedData.entities[kubernetesPodsSchemaKey][id] = p;
              mappedData.result.push(id);

            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchServicesInfo$ = this.actions$.ofType<GetKubernetesServices>(GET_SERVICE_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/services`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesServicesSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            info[action.kubeGuid].items.forEach((p: KubeService) => {
              const id = p.metadata.uid;
              mappedData.entities[kubernetesServicesSchemaKey][id] = p;
              mappedData.result.push(id);
            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchNamespaceInfo$ = this.actions$.ofType<GetKubernetesNamespaces>(GET_NAMESPACES_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/namespaces`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesNamespacesSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.kubeGuid;
            mappedData.entities[kubernetesNamespacesSchemaKey][id] = info[id].items;
            mappedData.result.push(id);
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchStatefulSets$ = this.actions$.ofType<GetKubernetesStatefulSets>(GET_KUBE_STATEFULSETS).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/statefulsets`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesStatefulSetsSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            info[action.kubeGuid].items.forEach((p: KubeService) => {
              const id = p.metadata.uid;
              mappedData.entities[kubernetesStatefulSetsSchemaKey][id] = p;
              mappedData.result.push(id);
            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchDeployments$ = this.actions$.ofType<GeKubernetesDeployments>(GET_KUBE_DEPLOYMENT).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/apis/apps/v1/deployments`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesDeploymentsSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            info[action.kubeGuid].items.forEach((p: KubeService) => {
              const id = p.metadata.uid;
              mappedData.entities[kubernetesDeploymentsSchemaKey][id] = p;
              mappedData.result.push(id);
            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

  @Effect()
  fetchKubernetesAppsInfo$ = this.actions$.ofType<GetKubernetesApps>(GET_KUBERNETES_APP_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new Headers({ 'x-cap-cnsi-list': action.kubeGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/api/v1/configmaps`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [kubernetesAppsSchemaKey]: {} },
              result: []
            } as NormalizedResponse;

            const id = action.kubeGuid;
            const releases = info[id].items
              .filter((configMap) => !!configMap.metadata.labels &&
                !!configMap.metadata.labels['NAME'] &&
                configMap.metadata.labels['OWNER'] === 'TILLER')
              .map((pod: KubernetesPod) => ({
                name: pod.metadata.labels['NAME'],
                namespace: pod.metadata.namespace
              })
              );
            const appReleases = releases.map((relaseObj) => (
              {
                name: relaseObj.name,
                kubeId: action.kubeGuid,
                namespace: relaseObj.namespace,
              })
            );

            appReleases.forEach(r => {
              const _id = `${r.kubeId}-${r.name}`;
              mappedData.entities[kubernetesAppsSchemaKey][_id] = r;
              if (mappedData.result.indexOf(_id) === -1) {
                mappedData.result.push(_id);
              }
            });
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );

}
