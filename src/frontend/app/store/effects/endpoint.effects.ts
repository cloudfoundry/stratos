import { IRequestAction, StartCFAction } from '../types/request.types';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { Observable } from 'rxjs/Rx';
import {
  CONNECT_ENDPOINTS,
  CONNECT_ENDPOINTS_FAILED,
  CONNECT_ENDPOINTS_SUCCESS,
  ConnectEndpoint,
  DISCONNECT_ENDPOINTS,
  DISCONNECT_ENDPOINTS_FAILED,
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  EndpointSchema,
  GET_ENDPOINTS,
  GetAllEndpoints,
  GetAllEndpointsFailed,
  GetAllEndpointsSuccess,
  REGISTER_ENDPOINTS,
  RegisterEndpoint,
  UNREGISTER_ENDPOINTS,
  UNREGISTER_ENDPOINTS_FAILED,
  UNREGISTER_ENDPOINTS_SUCCESS,
  UnregisterEndpoint,
  REGISTER_ENDPOINTS_SUCCESS,
  REGISTER_ENDPOINTS_FAILED,
} from '../actions/endpoint.actions';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';
import { EndpointModel, endpointStoreNames } from '../types/endpoint.types';
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
import { ClearPaginationOfType, ClearPaginationOfEntity } from '../actions/pagination.actions';

@Injectable()
export class EndpointsEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';
  static registeringKey = 'registering';

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllEndpoints$ = this.actions$.ofType<GetSystemSuccess>(GET_SYSTEM_INFO_SUCCESS)
    .pipe(mergeMap(action => {
      const endpointsActions = new GetAllEndpoints(action.login);
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(endpointsActions, actionType));

      const endpoints = action.payload.endpoints.cf; // We're only storing cf's??

      // Data is an array of endpoints
      const mappedData = {
        entities: {
          [endpointStoreNames.type]: {}
        },
        result: []
      } as NormalizedResponse;

      const data = Object.values(endpoints).forEach(endpointInfo => {
        mappedData.entities[endpointStoreNames.type][endpointInfo.guid] = {
          ...endpointInfo,
          connectionStatus: endpointInfo.user ? 'connected' : 'disconnected',
          registered: !!endpointInfo.user,
        };
        mappedData.result.push(endpointInfo.guid);
      });

      // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
      // (endpoint success)
      return [
        new WrapperRequestActionSuccess(mappedData, endpointsActions, actionType),
        new GetAllEndpointsSuccess(mappedData, endpointsActions.login),
      ];
    }));

  @Effect() connectEndpoint$ = this.actions$.ofType<ConnectEndpoint>(CONNECT_ENDPOINTS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = this.getEndpointUpdateAction(action.guid, action.type, EndpointsEffect.connectingKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_guid': action.guid,
          'username': action.username,
          'password': action.password,
        }
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/auth/login/cnsi',
        params,
        null,
        [CONNECT_ENDPOINTS_SUCCESS, CONNECT_ENDPOINTS_FAILED]
      );
    });

  @Effect() disconnect$ = this.actions$.ofType<DisconnectEndpoint>(DISCONNECT_ENDPOINTS)
    .flatMap(action => {

      const apiAction = this.getEndpointUpdateAction(action.guid, action.type, EndpointsEffect.disconnectingKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_guid': action.guid
        }
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/auth/logout/cnsi',
        params,
        null,
        [DISCONNECT_ENDPOINTS_SUCCESS, DISCONNECT_ENDPOINTS_FAILED]
      );
    });

  @Effect() unregister$ = this.actions$.ofType<UnregisterEndpoint>(UNREGISTER_ENDPOINTS)
    .flatMap(action => {

      const apiAction = this.getEndpointDeleteAction(action.guid, action.type);
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_guid': action.guid
        }
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/unregister',
        params,
        'delete',
        [UNREGISTER_ENDPOINTS_SUCCESS, UNREGISTER_ENDPOINTS_FAILED]
      );
    });

  @Effect() register$ = this.actions$.ofType<RegisterEndpoint>(REGISTER_ENDPOINTS)
    .flatMap(action => {

      const apiAction = this.getEndpointUpdateAction(action.guid(), action.type, EndpointsEffect.registeringKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_name': action.name,
          'api_endpoint': action.endpoint,
          'skip_ssl_validation': action.skipSslValidation ? 'true' : 'false',
        }
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/register/cf',
        params,
        'create',
        [REGISTER_ENDPOINTS_SUCCESS, REGISTER_ENDPOINTS_FAILED]
      );
    });


  private getEndpointUpdateAction(guid, type, updatingKey) {
    return {
      entityKey: endpointStoreNames.type,
      guid,
      type,
      updatingKey,
    } as IRequestAction;
  }

  private getEndpointDeleteAction(guid, type) {
    return {
      entityKey: endpointStoreNames.type,
      guid,
      type,
    } as IRequestAction;
  }

  private doEndpointAction(
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
      if (apiActionType === 'delete') {
        this.store.dispatch(new ClearPaginationOfEntity(apiAction.entityKey, apiAction.guid));
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
