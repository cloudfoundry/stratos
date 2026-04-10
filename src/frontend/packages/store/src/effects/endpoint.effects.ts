import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import {
  CONNECT_ENDPOINTS,
  ConnectEndpoint,
  DISCONNECT_ENDPOINTS,
  DisconnectEndpoint,
  EndpointActionComplete,
  GET_ENDPOINT,
  GET_ENDPOINTS,
  GetAllEndpoints,
  GetAllEndpointsSuccess,
  GetEndpoint,
  REGISTER_ENDPOINTS,
  RegisterEndpoint,
  UNREGISTER_ENDPOINTS,
  UnregisterEndpoint,
} from '../actions/endpoint.actions';
import { SendClearEventAction } from '../actions/internal-events.actions';
import { ClearPaginationOfEntity } from '../actions/pagination.actions';
import { GET_SYSTEM_INFO_SUCCESS, GetSystemSuccess } from '../actions/system.actions';
import { DispatchOnlyAppState } from '../app-state';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { EndpointType } from '../extension-types';
import { httpErrorResponseToSafeString } from '../jetstream';
import { ApiRequestTypes } from '../reducers/api-request-reducer/request-helpers';
import { stratosEntityCatalog } from '../stratos-entity-catalog';
import { NormalizedResponse } from '../types/api.types';
import { EndpointModel } from '../types/endpoint.types';
import {
  EntityRequestAction,
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../types/request.types';
import { UPDATE_ENDPOINT, UpdateEndpoint } from './../actions/endpoint.actions';
import { PaginatedAction } from './../types/pagination.types';


@Injectable({
  providedIn: 'root'
})
export class EndpointsEffect {
  private http = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<DispatchOnlyAppState>>(Store);
  private appRef = inject(ApplicationRef);


   getEndpoint$ = createEffect(() => this.actions$.pipe(
    ofType<GetEndpoint>(GET_ENDPOINT),
    mergeMap((action: GetEndpoint) => [
      stratosEntityCatalog.systemInfo.actions.getSystemInfo(false, action)
    ])
  ));

   getAllEndpointsBySystemInfo$ = createEffect(() => this.actions$.pipe(
    ofType<GetAllEndpoints>(GET_ENDPOINTS),
    mergeMap((action: GetAllEndpoints) => [
      stratosEntityCatalog.systemInfo.actions.getSystemInfo(false, action)
    ])
  ));

   getAllEndpoints$ = createEffect(() => this.actions$.pipe(
    ofType<GetSystemSuccess>(GET_SYSTEM_INFO_SUCCESS),
    mergeMap((action: GetSystemSuccess) => {
      const { associatedAction } = action;
      const entityKey = entityCatalog.getEntityKey(associatedAction);
      const endpoints = action.payload.endpoints;
      // Data is an array of endpoints
      const mappedData: NormalizedResponse<EndpointModel> = {
        entities: {
          [entityKey]: {}
        },
        result: []
      };

      Object.keys(endpoints).forEach((type: string) => {
        const endpointsForType = endpoints[type];
        Object.values(endpointsForType).forEach((endpointInfo: any) => {
          mappedData.entities[entityKey][endpointInfo.guid] = {
            ...endpointInfo,
            connectionStatus: endpointInfo.user ? 'connected' : 'disconnected',
          };
          mappedData.result.push(endpointInfo.guid);
        });
      });

      const isLogin = associatedAction.type === GET_ENDPOINTS ? (associatedAction as GetAllEndpoints).login : false;

      // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
      // (endpoint success)
      this.appRef.tick();
      return [
        new WrapperRequestActionSuccess(mappedData, associatedAction, 'fetch'),
        new GetAllEndpointsSuccess(mappedData, isLogin),
      ];
    })));

   connectEndpoint$ = createEffect(() => this.actions$.pipe(
    ofType<ConnectEndpoint>(CONNECT_ENDPOINTS),
    mergeMap((action: ConnectEndpoint): any[] | Observable<any> => {
      // Special-case SSO login - redirect to the back-end
      if (action.authType === 'sso') {
        const loc = window.location.protocol + '//' + window.location.hostname +
          (window.location.port ? ':' + window.location.port : '');
        const ssoUrl = '/api/v1/tokens?guid=' + action.guid + '&state=' + encodeURIComponent(loc);
        window.location.assign(ssoUrl);
        return [];
      }

      // All parameters should be sent in the form body
      const body = new FormData();
      body.set('cnsi_guid', action.guid);
      body.set('connect_type', action.authType);
      body.set('system_shared', String(action.systemShared));

      // Add auth values to the body
      Object.keys(action.authValues).forEach((key: string) => {
        body.set(key, (action.authValues as Record<string, any>)[key]);
      });

      // If there's a custom body provided, merge it
      if (action.body) {
        const customBody = action.body as any;
        if (customBody instanceof FormData) {
          customBody.forEach((value: any, key: string) => {
            body.set(key, value);
          });
        }
      }

      return this.doEndpointAction(
        action,
        '/api/v1/tokens',
        new HttpParams(),
        null as any,
        action.endpointsType,
        body,
        (response: any) => httpErrorResponseToSafeString(response) || 'Could not connect, please try again',
      );
    })));

   disconnect$ = createEffect(() => this.actions$.pipe(
    ofType<DisconnectEndpoint>(DISCONNECT_ENDPOINTS),
    mergeMap((action: DisconnectEndpoint) => {

      return this.doEndpointAction(
        action,
        '/api/v1/tokens/' + action.guid,
        null,
        null,
        action.endpointsType,
        null,
        null,
        'DELETE'
      );
    })));

   unregister$ = createEffect(() => this.actions$.pipe(
    ofType<UnregisterEndpoint>(UNREGISTER_ENDPOINTS),
    mergeMap((action: UnregisterEndpoint) => {
      return this.doEndpointAction(
        action,
        '/api/v1/endpoints/' + action.guid,
        null,
        'delete',
        action.endpointsType,
        null,
        null,
        'DELETE'
      );
    })));

   register$ = createEffect(() => this.actions$.pipe(
    ofType<RegisterEndpoint>(REGISTER_ENDPOINTS),
    mergeMap((action: RegisterEndpoint) => {
      const paramsObj: Record<string, string> = {
        endpoint_type: action.endpointsType,
        cnsi_name: action.name,
        api_endpoint: action.endpoint,
        skip_ssl_validation: action.skipSslValidation ? 'true' : 'false',
        cnsi_client_id: action.clientID || '',
        cnsi_client_secret: action.clientSecret || '',
        sso_allowed: action.ssoAllowed ? 'true' : 'false',
        create_system_endpoint: action.createSystemEndpoint ? 'true' : 'false',
        ca_cert: action.caCert || '',
      };
      // Do not include sub_type in HttpParams if it doesn't exist (falsies get stringified and sent)
      if (action.endpointSubType) {
        /* tslint:disable-next-line:no-string-literal  */
        paramsObj['sub_type'] = action.endpointSubType;
      }
      // Encode all values in the form body
      const body: any = new FormData();
      Object.keys(paramsObj).forEach((key: string) => {
        body.set(key, paramsObj[key]);
      });

      return this.doEndpointAction(
        action,
        '/api/v1/endpoints',
        new HttpParams(),
        'create',
        action.endpointsType,
        body,
        this.processRegisterError
      );
    })));

   updateEndpoint$ = createEffect(() => this.actions$.pipe(
    ofType<UpdateEndpoint>(UPDATE_ENDPOINT),
    mergeMap((action: UpdateEndpoint) => {
      const paramsObj: Record<string, string | boolean> = {
        name: action.name,
        skipSSL: action.skipSSL,
        setClientInfo: action.setClientInfo,
        clientID: action.clientID || '',
        clientSecret: action.clientSecret || '',
        allowSSO: action.allowSSO,
        ca_cert: action.caCert || '',
      };

      // Encode auth values in the body, not the query string
      const body: any = new FormData();
      Object.keys(paramsObj).forEach((key: string) => {
        body.set(key, String(paramsObj[key]));
      });

      return this.doEndpointAction(
        action,
        '/api/v1/endpoints/' + action.id,
        new HttpParams({}),
        'update',
        action.endpointsType,
        body,
        this.processUpdateError
      );
    })));

  private processUpdateError(e: HttpErrorResponse): string {
    let message = 'There was a problem updating the endpoint. ' +
      httpErrorResponseToSafeString(e);
    if (e.status === 403) {
      message = `${message}. Please check \"Skip SSL validation for the endpoint\" if the certificate issuer is trusted`;
    }
    return message;
  }

  private processRegisterError(e: HttpErrorResponse): string {
    let message = 'There was a problem creating the endpoint. Please ensure the endpoint address is correct and try again. ' +
      httpErrorResponseToSafeString(e);
    if (e.status === 403) {
      message = `${e.error.error}. Please check \"Skip SSL validation for the endpoint\" if the certificate issuer is trusted`;
    }
    return message;
  }

  /**
   * @param endpointType The underlying endpoints type (_cf_Endpoint, not _stratos_Endpoint)
   */
  private doEndpointAction(
    apiAction: EntityRequestAction | PaginatedAction,
    url: string,
    params: HttpParams,
    apiActionType: ApiRequestTypes = 'update',
    endpointType: EndpointType,
    body?: any,
    errorMessageHandler?: (e: any) => string,
    method: string = 'POST',
  ): Observable<any> {

    const endpointEntityKey = entityCatalog.getEntityKey(apiAction);
    this.store.dispatch(new StartRequestAction(apiAction, apiActionType));
    return this.http.request(method, url, {
      params,
      body: body || {}
    }).pipe(
      mergeMap((endpoint: EndpointModel) => {
        const actions = [];
        let response: NormalizedResponse<EndpointModel>;
        if (apiAction.actions[1]) {
          actions.push(new EndpointActionComplete(apiAction.actions[1], apiAction.guid, endpointType, endpoint));
        }

        if (apiActionType === 'delete') {
          actions.push(new ClearPaginationOfEntity(apiAction, apiAction.guid));
          actions.push(stratosEntityCatalog.userFavorite.actions.getAll());
        }

        if (apiActionType === 'create') {
          actions.push(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
          response = {
            entities: {
              [endpointEntityKey]: {
                [endpoint.guid]: endpoint
              }
            },
            result: [endpoint.guid]
          };
        }

        if (apiActionType === 'update') {
          actions.push(stratosEntityCatalog.systemInfo.actions.getSystemInfo());
        }

        if (apiAction.updatingKey === DisconnectEndpoint.UpdatingKey || apiActionType === 'create' || apiActionType === 'delete'
          || apiActionType === 'update') {
          actions.push(this.clearEndpointInternalEvents(apiAction.guid, endpointEntityKey));
        }

        actions.push(new WrapperRequestActionSuccess(response, apiAction, apiActionType, null, null, endpoint ? endpoint.guid : null));
        this.appRef.tick();
        return actions;
      }
      ),
      catchError((e: any) => {
        const actions = [];
        if (apiAction.actions[2]) {
          actions.push({ type: apiAction.actions[2], guid: apiAction.guid });
        }
        const errorMessage = errorMessageHandler ? errorMessageHandler(e) : 'Could not perform action';
        actions.push(new WrapperRequestActionFailed(errorMessage, apiAction, apiActionType));
        this.appRef.tick();
        return actions;
      }));
  }

  private clearEndpointInternalEvents(guid: string, endpointEntityKey: string) {
    return new SendClearEventAction(
      endpointEntityKey,
      guid,
      {
        clean: true
      }
    );
  }
}
