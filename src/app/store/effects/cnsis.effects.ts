import { IRequestAction, StartCFAction } from './../types/request.types';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { Observable } from 'rxjs/Rx';
import {
  CONNECT_CNSIS,
  ConnectCnis,
  DISCONNECT_CNSIS,
  DisconnectCnis,
  EndpointSchema,
  GET_CNSIS,
  GetAllCNSIS,
  GetAllCNSISFailed,
  GetAllCNSISSuccess,
  UNREGISTER_CNSIS,
  UnregisterCnis,
} from './../actions/cnsis.actions';
import { AppState } from './../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { CNSISModel, cnsisStoreNames } from '../types/cnsis.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../types/request.types';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { flatMap, mergeMap, catchError, tap } from 'rxjs/operators';


@Injectable()
export class CNSISEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';
  static unregisteringKey = 'unregistering';

  apiAction: IRequestAction;
  actionType;
  action;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {

   }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
  .pipe(
    flatMap(action => {
      this.actionType = 'fetch';
      this.apiAction = {
        entityKey: cnsisStoreNames.type,
      } as IRequestAction;
      this.action = action;
      this.store.dispatch(new StartRequestAction(this.apiAction, this.actionType));
      return Observable.zip(
        this.http.get('/pp/v1/cnsis'),
        this.http.get('/pp/v1/cnsis/registered'),
        (all, registered) => {
          const allCnsis: CNSISModel[] = all.json();
          const registeredCnsis: CNSISModel[] = registered.json();

          return allCnsis.map(c => {
            c.registered = !!registeredCnsis.find(r => r.guid === c.guid);
            return c;
          });
        });
    }),
    mergeMap(data => {
      const mappedData = {
        entities: {
          [cnsisStoreNames.type]: {}
        },
        result: []
      } as NormalizedResponse;

      data.forEach(cnsi => {
        mappedData.entities[cnsisStoreNames.type][cnsi.guid] = cnsi;
        mappedData.result.push(cnsi.guid);
      });
      // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
      // (cnsi success)
      return [
        new WrapperRequestActionSuccess(mappedData, this.apiAction, this.actionType),
        new GetAllCNSISSuccess(data, this.action.login),
      ];
    }),
    tap(p => console.log('###############################' + JSON.stringify(p))),
    catchError((err, caught) => [
      new WrapperRequestActionFailed(err.message, this.apiAction, this.actionType),
      new GetAllCNSISFailed(err.message, this.action.login),
    ])
  );

  @Effect() connectCnis$ = this.actions$.ofType<ConnectCnis>(CONNECT_CNSIS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = this.getEndpointAction(action.guid, action.type, CNSISEffect.connectingKey);
      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);
      params.append('username', action.username);
      params.append('password', action.password);

      return this.doCnisAction(
        apiAction,
        '/pp/v1/auth/login/cnsi',
        params
      );
    });

  @Effect() disconnect$ = this.actions$.ofType<DisconnectCnis>(DISCONNECT_CNSIS)
    .flatMap(action => {

      const apiAction = this.getEndpointAction(action.guid, action.type, CNSISEffect.disconnectingKey);

      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);

      return this.doCnisAction(
        apiAction,
        '/pp/v1/auth/logout/cnsi',
        params
      );
    });

  @Effect() unregister$ = this.actions$.ofType<UnregisterCnis>(UNREGISTER_CNSIS)
    .flatMap(action => {

      const apiAction = this.getEndpointAction(action.guid, action.type, CNSISEffect.unregisteringKey);

      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);

      return this.doCnisAction(
        apiAction,
        '/pp/v1/unregister',
        params,
        'delete'
      );
    });

  private getEndpointAction(guid, type, updatingKey) {
    return {
      entityKey: cnsisStoreNames.type,
      guid,
      type,
      updatingKey,
    } as IRequestAction;
  }


  private doCnisAction(apiAction: IRequestAction, url: string, params: URLSearchParams, apiActionType: ApiRequestTypes = 'update') {
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    this.store.dispatch(new StartRequestAction(apiAction, apiActionType));
    return this.http.post(url, params, {
      headers
    }).map(endpoint => {
      return new WrapperRequestActionSuccess(null, apiAction, apiActionType);
    })
      .catch(e => {
        return [new WrapperRequestActionFailed('Could not connect', apiAction, apiActionType)];
      });
  }
}
