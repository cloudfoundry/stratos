import { environment } from './../../../environments/environment';
import { AppState } from './../app-state';
import { APIAction, ApiActionTypes } from './../actions/APIActionType';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Action, Store } from '@ngrx/store';
import { Actions, Effect } from '@ngrx/effects';

import 'rxjs/add/observable/from';
import 'rxjs/add/operator/catch';


@Injectable()
export class APIEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  @Effect() apiRequestStart$ = this.actions$.ofType<APIAction>(ApiActionTypes.API_REQUEST)
    .mergeMap(apiAction => {
      console.log(apiAction);
      const startAction = Object.assign({}, apiAction, {
        type: ApiActionTypes.API_REQUEST_START
      });
      return [startAction, {type: apiAction.actions[0]}];
    });

  @Effect() apiRequest$ = this.actions$.ofType<APIAction>(ApiActionTypes.API_REQUEST_START)
    .map(apiAction => {
      const { requestType, url, payload } = apiAction;
      const { proxyAPIVersion, cfAPIVersion, baseURL } = environment;
      const fullURL = `${baseURL}/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${url}`;
      return this.http[requestType](fullURL, payload)
        .map(data => {
          const successAction = Object.assign({}, apiAction, {
            type: ApiActionTypes.API_REQUEST_SUCCESS
          });
          console.log(successAction);
          return [
            successAction, {
            type: apiAction.actions[1]
          }];
        })
        .catch(() => {
          const failedAction = Object.assign({}, apiAction, {
            type: ApiActionTypes.API_REQUEST_FAILED
          });
          console.log(failedAction);
          return [
            failedAction, {
            type: apiAction.actions[2]
          }];
        });
    });
}
