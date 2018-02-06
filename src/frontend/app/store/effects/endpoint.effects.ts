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
  UNREGISTER_ENDPOINTS,
  UNREGISTER_ENDPOINTS_FAILED,
  UNREGISTER_ENDPOINTS_SUCCESS,
  UnregisterEndpoint,
} from '../actions/endpoint.actions';
import { AppState } from '../app-state';
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams } from '@angular/http';
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


@Injectable()
export class EndpointsEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';
  static unregisteringKey = 'unregistering';

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllEndpoints$ = this.actions$.ofType<GetAllEndpoints>(GET_ENDPOINTS)
    .flatMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return Observable.zip(
        this.http.get('/pp/v1/cnsis'),
        this.http.get('/pp/v1/cnsis/registered'),
        (all, registered) => {
          const allEndpoints: EndpointModel[] = all.json();
          const registeredEndpoints: EndpointModel[] = registered.json();

          return allEndpoints.map(c => {
            c.registered = !!registeredEndpoints.find(r => r.guid === c.guid);
            return c;
          });
        }
      )
        .mergeMap(data => {
          const mappedData = {
            entities: {
              [endpointStoreNames.type]: {}
            },
            result: []
          } as NormalizedResponse;

          data.forEach(endpoint => {
            mappedData.entities[endpointStoreNames.type][endpoint.guid] = endpoint;
            mappedData.result.push(endpoint.guid);
          });
          // Order is important. Need to ensure data is written (none cf action success) before we notify everything is loaded
          // (endpoint success)
          return [
            new WrapperRequestActionSuccess(mappedData, action, actionType),
            new GetAllEndpointsSuccess(data, action.login),
          ];
        })
        .catch((err, caught) => [
          new WrapperRequestActionFailed(err.message, action, actionType),
          new GetAllEndpointsFailed(err.message, action.login),
        ]);

    });


  @Effect() connectEndpoint$ = this.actions$.ofType<ConnectEndpoint>(CONNECT_ENDPOINTS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = this.getEndpointAction(action.guid, action.type, EndpointsEffect.connectingKey);
      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);
      params.append('username', action.username);
      params.append('password', action.password);

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

      const apiAction = this.getEndpointAction(action.guid, action.type, EndpointsEffect.disconnectingKey);

      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);

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

      const apiAction = this.getEndpointAction(action.guid, action.type, EndpointsEffect.unregisteringKey);

      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);

      return this.doEndpointAction(
        apiAction,
        '/pp/v1/unregister',
        params,
        'delete',
        [UNREGISTER_ENDPOINTS_SUCCESS, UNREGISTER_ENDPOINTS_FAILED]
      );
    });

  private getEndpointAction(guid, type, updatingKey) {
    return {
      entityKey: endpointStoreNames.type,
      guid,
      type,
      updatingKey,
    } as IRequestAction;
  }


  private doEndpointAction(
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
