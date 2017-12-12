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


@Injectable()
export class CNSISEffect {

  static connectingKey = 'connecting';
  static disconnectingKey = 'disconnecting';

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() getAllCNSIS$ = this.actions$.ofType<GetAllCNSIS>(GET_CNSIS)
    .flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
      } as IRequestAction;
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
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
            new WrapperRequestActionSuccess(mappedData, apiAction, actionType),
            new GetAllCNSISSuccess(data, action.login),
          ];
        })
        .catch((err, caught) => [
          new WrapperRequestActionFailed(err.message, apiAction, actionType),
          new GetAllCNSISFailed(err.message, action.login),
        ]);

    });

  @Effect() connectCnis$ = this.actions$.ofType<ConnectCnis>(CONNECT_CNSIS)
    .flatMap(action => {
      const actionType = 'update';
      const apiAction = {
        entityKey: cnsisStoreNames.type,
        guid: action.guid,
        type: action.type,
        updatingKey: CNSISEffect.connectingKey,
      } as IRequestAction;

      const headers = new Headers();
      headers.append('Content-Type', 'application/x-www-form-urlencoded');
      const params: URLSearchParams = new URLSearchParams();
      params.append('cnsi_guid', action.guid);
      params.append('username', action.username);
      params.append('password', action.password);

      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http.post('/pp/v1/auth/login/cnsi', params, {
        headers
      }).map(endpoint => {
        return new WrapperRequestActionSuccess({ entities: {}, result: [] }, apiAction, 'update');
      })
        .catch(e => {
          return [new WrapperRequestActionFailed('Could not connect', apiAction, actionType)];
        });
    });
}
