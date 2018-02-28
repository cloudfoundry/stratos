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
  ) { }

  @Effect()
  fetchInfo$ = this.actions$.ofType<GetCaaspInfo>(GET_INFO).pipe(
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      return this.http
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
            return [
              new WrapperRequestActionSuccess(mappedData, action)
            ];
          }),
          catchError(err => [
            new WrapperRequestActionFailed(err.message, action)
          ])
        );
    })
  );
}
