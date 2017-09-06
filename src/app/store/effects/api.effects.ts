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
import 'rxjs/add/operator/switchMap';


@Injectable()
export class APIEffect {

  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect() apiRequestStart$ = this.actions$.ofType<APIAction>(ApiActionTypes.API_REQUEST)
    .mergeMap(apiAction => {
      const startAction = this.newAPIAction({
        oldAPIAction: apiAction,
        apiRequestType: apiAction.actions[0],
        actionType: ApiActionTypes.API_REQUEST_START,
        loading: true
      });
      return [
        startAction,
        { type: apiAction.actions[0] }
      ];
    });

  @Effect() apiRequest$ = this.actions$.ofType<APIAction>(ApiActionTypes.API_REQUEST_START)
    .switchMap(apiAction => {
      const { httpMethod, apiRequestType, url, payload } = apiAction;
      const { proxyAPIVersion, cfAPIVersion } = environment;
      const fullURL = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${url}`;
      return this.http[httpMethod](fullURL, payload)
        .mergeMap(data => {
          apiAction.type = apiAction.actions[1];
          apiAction.apiRequestType = ApiActionTypes.API_REQUEST_SUCCESS;
          apiAction.payload = data;
          apiAction.loading = false;
          return apiAction;
        })
        .catch(() => {
          const failedAction = this.newAPIAction({
            oldAPIAction: apiAction,
            apiRequestType: ApiActionTypes.API_REQUEST_FAILED,
            actionType: apiAction.actions[2],
            loading: false
          });
          return [failedAction];
        });
    }).catch((err, caught) => {
      return caught;
    });

  newAPIAction({
      oldAPIAction,
    apiRequestType,
    actionType,
    loading
    }) {
    class NewAPIAction implements APIAction {
      actions = oldAPIAction.actions;
      url = oldAPIAction.url;
      apiRequestType = apiRequestType;
      httpMethod = oldAPIAction.httpMethod;
      payload = oldAPIAction.payload;
      type = actionType;
      loading = loading;
    }
    return new NewAPIAction;
  }
}
