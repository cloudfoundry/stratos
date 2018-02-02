import { IRequestAction, StartCFAction } from './../types/request.types';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { Observable } from 'rxjs/Rx';
import {
  CONNECT_CNSIS,
  CONNECT_CNSIS_FAILED,
  CONNECT_CNSIS_SUCCESS,
  ConnectCnis,
  DISCONNECT_CNSIS,
  DISCONNECT_CNSIS_FAILED,
  DISCONNECT_CNSIS_SUCCESS,
  DisconnectCnis,
  EndpointSchema,
  GET_CNSIS,
  GetAllCNSIS,
  GetAllCNSISFailed,
  GetAllCNSISSuccess,
  UNREGISTER_CNSIS,
  UNREGISTER_CNSIS_FAILED,
  UNREGISTER_CNSIS_SUCCESS,
  UnregisterCnis,
  REGISTER_CNSIS,
  REGISTER_CNSIS_FAILED,
  REGISTER_CNSIS_SUCCESS,
  RegisterCnis,
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
import { PaginatedAction } from '../types/pagination.types';


@Injectable()
export class CNSISEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';
  static registeringKey = 'registering';
  static unregisteringKey = 'unregistering';

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
    .flatMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
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
        }
      )
        .mergeMap(data => {
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
            new WrapperRequestActionSuccess(mappedData, action, actionType),
            new GetAllCNSISSuccess(data, action.login),
          ];
        })
        .catch((err, caught) => [
          new WrapperRequestActionFailed(err.message, action, actionType),
          new GetAllCNSISFailed(err.message, action.login),
        ]);

    });


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
        params,
        null,
        [CONNECT_CNSIS_SUCCESS, CONNECT_CNSIS_FAILED]
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
        params,
        null,
        [DISCONNECT_CNSIS_SUCCESS, DISCONNECT_CNSIS_FAILED]
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
        'delete',
        [UNREGISTER_CNSIS_SUCCESS, UNREGISTER_CNSIS_FAILED]
      );
    });

  @Effect() register$ = this.actions$.ofType<RegisterCnis>(REGISTER_CNSIS)
  .flatMap(action => {

    const apiAction = this.getEndpointAction(action.guid(), action.type, CNSISEffect.registeringKey);

    const params: URLSearchParams = new URLSearchParams();
    params.append('cnsi_name', action.name);
    params.append('api_endpoint', action.endpoint);
    params.append('skip_ssl_validation', action.skipSslValidation ? 'true' : 'false');

    return this.doCnisAction(
      apiAction,
      '/pp/v1/register/cf',
      params,
      'create',
      [REGISTER_CNSIS_SUCCESS, REGISTER_CNSIS_FAILED]
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

  private doCnisAction(
    apiAction: IRequestAction,
    url: string,
    params: URLSearchParams,
    apiActionType: ApiRequestTypes = 'update',
    actionStrings: [string, string] = [null, null]
  ) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    this.store.dispatch(new StartRequestAction(apiAction, apiActionType));
    return this.http.post(url, params, {
      headers
    }).map(endpoint => {
      if (actionStrings[0]) {
        this.store.dispatch({ type: actionStrings[0] });
      }
      return new WrapperRequestActionSuccess(null, apiAction, apiActionType);
    })
      .catch(e => {
        if (actionStrings[1]) {
          this.store.dispatch({ type: actionStrings[1] });
        }
        return [new WrapperRequestActionFailed('Could not connect', apiAction, apiActionType)];
      });
  }
}
