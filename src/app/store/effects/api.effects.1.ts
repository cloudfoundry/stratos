import { CNSISModel } from './../reducers/cnsis.reducer';
import { environment } from './../../../environments/environment';
import { AppState } from './../app-state';
import { APIAction, ApiActionTypes, StartAPIAction } from './../actions/api.actions';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
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
    .map(apiAction => {
      return new StartAPIAction(apiAction.options, apiAction.actions);
    });

  @Effect() apiRequest$ = this.actions$.ofType<StartAPIAction>(ApiActionTypes.API_REQUEST_START)
    .withLatestFrom(this.store)
    .switchMap(([apiAction, { cnsis }]) => {
      // const { cnsis } = state;
      // const { httpMethod, apiRequestType, url, params, body } = apiAction;
      this.store.dispatch(this.getActionFromString(apiAction.actions[0]));

      const { proxyAPIVersion, cfAPIVersion } = environment;
      const fullURL = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${url}`;
      return this.http[httpMethod](fullURL, {})
        .mergeMap(data => {
          apiAction.type = apiAction.actions[1];
          apiAction.apiRequestType = ApiActionTypes.API_REQUEST_SUCCESS;
          // apiAction.payload = data;
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

    // newAPIAction({
    //   oldAPIAction,
    //   apiRequestType,
    //   actionType,
    //   loading
    // }) {
    //   class NewAPIAction implements APIAction {
    //     actions = oldAPIAction.actions;
    //     url = oldAPIAction.url;
    //     apiRequestType = apiRequestType;
    //     httpMethod = oldAPIAction.httpMethod;
    //     payload = oldAPIAction.payload;
    //     type = actionType;
    //     loading = loading;
    //   }
    //   return new NewAPIAction;
    // }
    getBaseHeaders(cnsiss: CNSISModel[]): Headers {
      const headers = new Headers();
      headers.set('x-cnap-cnsi-list', cnsiss.map(c => c.guid));
      headers.set('x-cnap-passthrough', 'true');
      return headers;
    }

    getActionFromString(type: string) {
      return { type };
    }

}
