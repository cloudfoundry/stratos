import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';

import {
  AddApiKey,
  API_KEY_ADD,
  API_KEY_DELETE,
  API_KEY_GET_ALL,
  DeleteApiKey,
  GetAllApiKeys,
} from '../actions/apiKey.actions';
import { ApiKey } from '../apiKey.types';
import { InternalAppState } from '../app-state';
import { BrowserStandardEncoder } from '../browser-encoder';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { proxyAPIVersion } from '../jetstream';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';

const apiKeyUrlPath = `/pp/${proxyAPIVersion}/api_keys`;

@Injectable()
export class ApiKeyEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<InternalAppState>,
  ) {
  }

  @Effect() add = this.actions$.pipe(
    ofType<AddApiKey>(API_KEY_ADD),
    mergeMap(action => {
      const actionType = 'create';
      this.store.dispatch(new StartRequestAction(action, actionType))
      const params = new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: {
          comment: action.comment
        }
      });

      return this.http.post<ApiKey>(apiKeyUrlPath, params).pipe(
        switchMap(newApiKey => {
          // TODO: RC FIX array/dispatch
          const guid = action.entity[0].getId(newApiKey);
          const entityKey = entityCatalog.getEntityKey(action);
          const response: NormalizedResponse<ApiKey> = {
            entities: {
              [entityKey]: {
                [guid]: newApiKey
              }
            },
            result: [guid]
          }
          this.store.dispatch(new WrapperRequestActionSuccess(response, action, actionType));
          return [];
        }),
        catchError(err => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          return [];
        })
      );
    })
  );

  @Effect() delete = this.actions$.pipe(
    ofType<DeleteApiKey>(API_KEY_DELETE),
    mergeMap(action => {
      const actionType = 'delete';
      this.store.dispatch(new StartRequestAction(action, actionType))

      return this.http.request('delete', apiKeyUrlPath, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        body: {
          guid: action.guid
        }
      }).pipe(
        switchMap(() => {
          // TODO: RC FIX array/dispatch
          this.store.dispatch(new WrapperRequestActionSuccess(null, action, actionType));
          return [];
        }),
        catchError(err => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          return [];
        })
      );
    })
  );

  @Effect() getAll = this.actions$.pipe(
    ofType<GetAllApiKeys>(API_KEY_GET_ALL),
    mergeMap(action => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType))
      return this.http.get(apiKeyUrlPath).pipe(
        switchMap((res: ApiKey[]) => {
          const entityKey = entityCatalog.getEntityKey(action);
          const response: NormalizedResponse<ApiKey> = {
            entities: {
              [entityKey]: {
              }
            },
            result: []
          }

          res.forEach(apiKey => {
            const guid = action.entity[0].getId(apiKey);
            response.entities[entityKey][guid] = apiKey;
            response.result.push(guid);
          });


          // TODO: RC FIX array/dispatch
          this.store.dispatch(new WrapperRequestActionSuccess(response, action, actionType));
          return [];
        }),
        catchError(err => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          return [];
        })
      );
    })
  );

  private convertErrorToString(err: any): string {
    // TODO: RC beef up
    return err && err.error ? err.error : 'Failed API Key action';
  }
}