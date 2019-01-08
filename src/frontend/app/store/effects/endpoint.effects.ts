import { PaginatedAction } from './../types/pagination.types';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap, tap } from 'rxjs/operators';

import { BrowserStandardEncoder } from '../../helper';
import {
  CONNECT_ENDPOINTS,
  CONNECT_ENDPOINTS_FAILED,
  CONNECT_ENDPOINTS_SUCCESS,
  ConnectEndpoint,
  DISCONNECT_ENDPOINTS,
  DISCONNECT_ENDPOINTS_FAILED,
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  EndpointActionComplete,
  GetAllEndpointsSuccess,
  REGISTER_ENDPOINTS,
  REGISTER_ENDPOINTS_FAILED,
  REGISTER_ENDPOINTS_SUCCESS,
  RegisterEndpoint,
  UNREGISTER_ENDPOINTS,
  UNREGISTER_ENDPOINTS_FAILED,
  UNREGISTER_ENDPOINTS_SUCCESS,
  UnregisterEndpoint,
} from '../actions/endpoint.actions';
import { ClearPaginationOfEntity } from '../actions/pagination.actions';
import { GET_SYSTEM_INFO_SUCCESS, GetSystemInfo, GetSystemSuccess } from '../actions/system.actions';
import { AppState } from '../app-state';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../types/api.types';
import { EndpointModel, endpointStoreNames } from '../types/endpoint.types';
import {
  IRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../types/request.types';
import { EndpointType } from '../../core/extension/extension-types';
import { SendClearEventAction } from '../actions/internal-events.actions';
import { endpointSchemaKey } from '../helpers/entity-factory';


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
      const { associatedAction } = action;
      const actionType = 'fetch';
      const endpoints = action.payload.endpoints;
      // Data is an array of endpoints
      const mappedData = {
        entities: {
          [endpointStoreNames.type]: {}
        },
        result: []
      } as NormalizedResponse;

      Object.keys(endpoints).forEach((type: string) => {
        const endpointsForType = endpoints[type];
        Object.values(endpointsForType).forEach(endpointInfo => {
          mappedData.entities[endpointStoreNames.type][endpointInfo.guid] = {
            ...endpointInfo,
            connectionStatus: endpointInfo.user ? 'connected' : 'disconnected',
            registered: !!endpointInfo.user,
          };
          mappedData.result.push(endpointInfo.guid);
        });
      });

      // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
      // (endpoint success)
      return [
        new WrapperRequestActionSuccess(mappedData, associatedAction, actionType),
        new GetAllEndpointsSuccess(mappedData, associatedAction.login),
      ];
    }));

  @Effect() connectEndpoint$ = this.actions$.ofType<ConnectEndpoint>(CONNECT_ENDPOINTS).pipe(
    mergeMap(action => {
      const actionType = 'update';

      // Special-case SSO login - redirect to the back-end
      if (action.authType === 'sso') {
        const loc = window.location.protocol + '//' + window.location.hostname +
          (window.location.port ? ':' + window.location.port : '');
        const ssoUrl = '/pp/v1/auth/login/cnsi?guid=' + action.guid + '&state=' + encodeURIComponent(loc);
        window.location.assign(ssoUrl);
        return [];
      }

      const apiAction = this.getEndpointUpdateAction(action.guid, action.type, EndpointsEffect.connectingKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          ...<any>action.authValues,
          'cnsi_guid': action.guid,
          'connect_type': action.authType,
          'system_shared': action.systemShared,
        },
        // Fix for #angular/18261
        encoder: new BrowserStandardEncoder()
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/auth/login/cnsi',
        params,
        null,
        [CONNECT_ENDPOINTS_SUCCESS, CONNECT_ENDPOINTS_FAILED],
        action.endpointType,
        action.body,
      ).pipe(
        tap(() => this.clearEndpointInternalEvents(action.guid))
      );
    }));

  @Effect() disconnect$ = this.actions$.ofType<DisconnectEndpoint>(DISCONNECT_ENDPOINTS).pipe(
    mergeMap(action => {

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
        [DISCONNECT_ENDPOINTS_SUCCESS, DISCONNECT_ENDPOINTS_FAILED],
        action.endpointType
      ).pipe(
        tap(() => this.clearEndpointInternalEvents(action.guid))
      );
    }));

  @Effect() unregister$ = this.actions$.ofType<UnregisterEndpoint>(UNREGISTER_ENDPOINTS).pipe(
    mergeMap(action => {

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
        [UNREGISTER_ENDPOINTS_SUCCESS, UNREGISTER_ENDPOINTS_FAILED],
        action.endpointType
      ).pipe(
        tap(() => this.clearEndpointInternalEvents(action.guid))
      );
    }));

  @Effect() register$ = this.actions$.ofType<RegisterEndpoint>(REGISTER_ENDPOINTS).pipe(
    mergeMap(action => {

      const apiAction = this.getEndpointUpdateAction(action.guid(), action.type, EndpointsEffect.registeringKey);
      const params: HttpParams = new HttpParams({
        fromObject: {
          'cnsi_name': action.name,
          'api_endpoint': action.endpoint,
          'skip_ssl_validation': action.skipSslValidation ? 'true' : 'false',
          'cnsi_client_id': action.clientID,
          'cnsi_client_secret': action.clientSecret,
          'sso_allowed': action.ssoAllowed ? 'true' : 'false',
        }
      });

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/register/' + action.endpointType,
        params,
        'create',
        [REGISTER_ENDPOINTS_SUCCESS, REGISTER_ENDPOINTS_FAILED],
        action.endpointType,
        null,
        this.processRegisterError
      );
    }));

  private processRegisterError(e: HttpErrorResponse): string {
    let message = 'There was a problem creating the endpoint. ' +
      `Please ensure the endpoint address is correct and try again (${e.error.error})`;
    if (e.status === 403) {
      message = `${e.error.error}. Please check \"Skip SSL validation for the endpoint\" if the certificate issuer is trusted"`;
    }
    return message;
  }
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
    apiAction: IRequestAction | PaginatedAction,
    url: string,
    params: HttpParams,
    apiActionType: ApiRequestTypes = 'update',
    actionStrings: [string, string] = [null, null],
    endpointType: EndpointType = 'cf',
    body?: string,
    errorMessageHandler?: Function,
  ) {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/x-www-form-urlencoded');
    this.store.dispatch(new StartRequestAction(apiAction, apiActionType));
    return this.http.post(url, body || {}, {
      headers,
      params
    }).pipe(
      mergeMap((endpoint: EndpointModel) => {
        const actions = [];
        if (actionStrings[0]) {
          actions.push(new EndpointActionComplete(actionStrings[0], apiAction.guid, endpointType, endpoint));
        }
        if (apiActionType === 'delete') {
          actions.push(new ClearPaginationOfEntity(apiAction.entityKey, apiAction.guid));
        }
        if (apiActionType === 'create') {
          actions.push(new GetSystemInfo());
        }
        actions.push(new WrapperRequestActionSuccess(null, apiAction, apiActionType));
        return actions;
      }
      ),
      catchError(e => {
        const actions = [];
        if (actionStrings[1]) {
          actions.push({ type: actionStrings[1], guid: apiAction.guid });
        }
        const errorMessage = errorMessageHandler ? errorMessageHandler(e) : 'Could not perform action';
        actions.push(new WrapperRequestActionFailed(errorMessage, apiAction, apiActionType));
        return actions;
      }));
  }

  private clearEndpointInternalEvents(guid: string) {
    this.store.dispatch(
      new SendClearEventAction(
        endpointSchemaKey,
        guid,
        {
          clean: true
        }
      )
    );
  }
}
