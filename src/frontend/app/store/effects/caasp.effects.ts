import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatMap, mergeMap } from 'rxjs/operators';

import {
  CAASP_INFO_ENTITY_KEY,
  GET_INFO,
  GetCaaspInfo
} from '../actions/caasp.actions';
import { NormalizedResponse } from '../types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess
} from '../types/request.types';
import { environment } from './../../../environments/environment';
import { AppState } from './../app-state';
import { catchError } from 'rxjs/operators/catchError';

@Injectable()
export class CaaspEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  @Effect()
  fetchInfo$ = this.actions$.ofType<GetCaaspInfo>(GET_INFO).pipe(
    flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: CAASP_INFO_ENTITY_KEY,
        type: action.type
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      return this.http
        //.get(`/pp/${this.proxyAPIVersion}/proxy/v2/info`, requestArgs)
        .get(`/pp/${this.proxyAPIVersion}/caasp/${action.caaspGuid}/info`)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { caaspInfo: {} },
              result: []
            } as NormalizedResponse;
            const id = action.caaspGuid;

            mappedData.entities[CAASP_INFO_ENTITY_KEY][id] = {
              entity: info,
              metadata: {}
            };
            mappedData.result.push(id);

            console.log('HELLO')
            console.log(mappedData);
            return [
              new WrapperRequestActionSuccess(mappedData, apiAction, actionType)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, apiAction, actionType)
          ])
        );
    })
  );
}
