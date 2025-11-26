import { HttpClient, HttpParams } from '@angular/common/http';
import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

import {
  type AddApiKey,
  API_KEY_ADD,
  API_KEY_DELETE,
  API_KEY_GET_ALL,
  type DeleteApiKey,
  type GetAllApiKeys,
} from '../actions/apiKey.actions';
import type { ApiKey } from '../apiKey.types';
import type { InternalAppState } from '../app-state';
import { BrowserStandardEncoder } from '../browser-encoder';
import { entityCatalog } from '../entity-catalog/entity-catalog';
import { proxyAPIVersion } from '../jetstream';
import type { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';

const apiKeyUrlPath = `/pp/${proxyAPIVersion}/api_keys`;

@Injectable({
  providedIn: 'root'
})
export class ApiKeyEffect {

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<InternalAppState>,
    private appRef: ApplicationRef
  ) {
  }

   add = createEffect(() => this.actions$.pipe(
    ofType<AddApiKey>(API_KEY_ADD),
    mergeMap((action: AddApiKey) => {
      const actionType = 'create';
      this.store.dispatch(new StartRequestAction(action, actionType));

      return this.http.post<ApiKey>(apiKeyUrlPath, new HttpParams({
        encoder: new BrowserStandardEncoder(),
        fromObject: {
          comment: action.comment
        }
      })).pipe(
        switchMap((newApiKey: ApiKey) => {
          const guid = action.entity[0].getId(newApiKey);
          const entityKey = entityCatalog.getEntityKey(action);
          const response: NormalizedResponse<ApiKey> = {
            entities: {
              [entityKey]: {
                [guid]: newApiKey
              }
            },
            result: [guid]
          };
          this.store.dispatch(new WrapperRequestActionSuccess(response, action, actionType));
          this.appRef.tick();
          return EMPTY;
        }),
        catchError((err: unknown) => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          this.appRef.tick();
          return EMPTY;
        })
      );
    })
  ), { dispatch: false });

   delete = createEffect(() => this.actions$.pipe(
    ofType<DeleteApiKey>(API_KEY_DELETE),
    mergeMap((action: DeleteApiKey) => {
      const actionType = 'delete';
      this.store.dispatch(new StartRequestAction(action, actionType));

      return this.http.delete(apiKeyUrlPath, {
        params: new HttpParams({
          encoder: new BrowserStandardEncoder(),
          fromObject: {
            guid: action.guid
          }
        })
      }).pipe(
        switchMap(() => {
          this.store.dispatch(new WrapperRequestActionSuccess(null, action, actionType));
          this.appRef.tick();
          return EMPTY;
        }),
        catchError((err: unknown) => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          this.appRef.tick();
          return EMPTY;
        })
      );
    })
  ), { dispatch: false });

   getAll = createEffect(() => this.actions$.pipe(
    ofType<GetAllApiKeys>(API_KEY_GET_ALL),
    mergeMap((action: GetAllApiKeys) => {
      const actionType = 'fetch';
      this.store.dispatch(new StartRequestAction(action, actionType));
      return this.http.get(apiKeyUrlPath).pipe(
        switchMap((res: ApiKey[]) => {
          const entityKey = entityCatalog.getEntityKey(action);
          const response: NormalizedResponse<ApiKey> = {
            entities: {
              [entityKey]: {
              }
            },
            result: []
          };

          res.forEach(apiKey => {
            const guid = action.entity[0].getId(apiKey);
            response.entities[entityKey][guid] = apiKey;
            response.result.push(guid);
          });

          this.store.dispatch(new WrapperRequestActionSuccess(response, action, actionType));
          this.appRef.tick();
          return EMPTY;
        }),
        catchError((err: unknown) => {
          this.store.dispatch(new WrapperRequestActionFailed(this.convertErrorToString(err), action, actionType));
          this.appRef.tick();
          return EMPTY;
        })
      );
    })
  ), { dispatch: false });

  private convertErrorToString(err: unknown): string {
    // We should look into beefing this up / combining with generic error handling
    return (err as { error?: string })?.error ? (err as { error: string }).error : 'Failed API Key action';
  }
}
