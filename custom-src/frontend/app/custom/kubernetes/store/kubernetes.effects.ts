import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { AppState } from '../../../store/app-state';
import { NormalizedResponse } from '../../../store/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../store/types/request.types';
import { GetKubernetesNodes, GET_NODE_INFO, GetKubernetesPods, GET_POD_INFO, GetKubernetesNamespaces, GET_NAMESPACES_INFO } from './kubernetes.actions';
import { flatMap, mergeMap, catchError } from 'rxjs/operators';
import { kubernetesNodesSchemaKey } from '../../../store/helpers/entity-factory';
import { kubernetesPodsSchemaKey, kubernetesNamespacesSchemaKey } from '../../../../../../src/frontend/app/store/helpers/entity-factory';


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
            console.log('KUBE DATA');
            console.log(info[id].items);
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
  fetchPodInfo$ = this.actions$.ofType<GetKubernetesPods>(GET_POD_INFO).pipe(
    flatMap(action => {
      console.log('Firing off getPods Request');
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
            const id = action.kubeGuid;
            mappedData.entities[kubernetesPodsSchemaKey][id] = info[id].items;
            mappedData.result.push(id);
            console.log('KUBE DATA');
            console.log(info[id].items);
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
  fetchNamespacenfo$ = this.actions$.ofType<GetKubernetesNamespaces>(GET_NAMESPACES_INFO).pipe(
    flatMap(action => {
      console.log('Firing off getPods Request');
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
            console.log('KUBE DATA');
            console.log(info[id].items);
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
