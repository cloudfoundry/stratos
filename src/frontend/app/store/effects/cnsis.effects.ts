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
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SystemInfo } from '../types/system.types';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { GetSystemInfo, GET_SYSTEM_INFO, GET_SYSTEM_INFO_SUCCESS, GetSystemSuccess } from '../actions/system.actions';

@Injectable()
export class CNSISEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';
  static registeringKey = 'registering';
  static unregisteringKey = 'unregistering';

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetSystemSuccess>(GET_SYSTEM_INFO_SUCCESS)
    .pipe(mergeMap(action => {
      const paginationAction = new GetAllCNSIS(action.login);
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(paginationAction, actionType));

      const endpoints = action.payload.endpoints;

      // Data is an aarray of endpoints
      const mappedData = {
        entities: {
          [cnsisStoreNames.type]: {}
        },
        result: []
      } as NormalizedResponse;

      Object.keys(endpoints).forEach((type: string) => {
        const endpointsForType = endpoints[type];
        Object.values(endpointsForType).forEach(endpointInfo => {
          mappedData.entities[cnsisStoreNames.type][endpointInfo.guid] = {
            ...endpointInfo,
            connectionStatus: endpointInfo.user ? 'connected' : 'disconnected',
            registered: !!endpointInfo.user,
          };
          mappedData.result.push(endpointInfo.guid);
        });
      });

      // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
      // (cnsi success)
      return [
        new WrapperRequestActionSuccess(mappedData, paginationAction, actionType),
        new GetAllCNSISSuccess(paginationAction.login),
      ];
    }));

  @Effect() connectCnis$ = this.actions$.ofType<ConnectCnis>(CONNECT_CNSIS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = this.getEndpointAction(action.guid, action.type, CNSISEffect.connectingKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          ...<any>action.authValues,
          'cnsi_guid': action.guid,
          'auth_type': action.authType,
        }
      });

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
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_guid': action.guid
        }
      });

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
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_guid': action.guid
        }
      });

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
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_name': action.name,
          'api_endpoint': action.endpoint,
          'skip_ssl_validation': action.skipSslValidation ? 'true' : 'false',
        }
      });

      return this.doCnisAction(
        apiAction,
        '/pp/v1/register/' + action.endpointType,
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
    params: HttpParams,
    apiActionType: ApiRequestTypes = 'update',
    actionStrings: [string, string] = [null, null]
  ) {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    this.store.dispatch(new StartRequestAction(apiAction, apiActionType));
    return this.http.post(url, {}, {
      headers,
      params
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
