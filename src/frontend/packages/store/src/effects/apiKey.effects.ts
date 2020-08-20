import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { proxyAPIVersion } from '../jetstream';
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
      return this.http.post<ApiKey>(apiKeyUrlPath, {
        comment: action.comment
      }).pipe(
        switchMap(newApiKey => {
          // TODO: RC FIX array/dispatch
          // TODO: RC add to store?
          this.store.dispatch(new WrapperRequestActionSuccess(null, action, actionType));
          return [];
        }),
        catchError(() => {
          this.store.dispatch(new WrapperRequestActionFailed('Failed to add api key', action, actionType));
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
        catchError(() => {
          this.store.dispatch(new WrapperRequestActionFailed('Failed to delete api key', action, actionType));
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
        switchMap(res => {
          // TODO: RC FIX array/dispatch
          // TODO: RC add res to wrapper success
          this.store.dispatch(new WrapperRequestActionSuccess(null, action, actionType));
          return [];
        }),
        catchError(() => {
          this.store.dispatch(new WrapperRequestActionFailed('Failed to get all api keys', action, actionType));
          return [];
        })
      );
    })
  );

}