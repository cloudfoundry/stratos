import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatMap, mergeMap } from 'rxjs/operators';
import { catchError } from 'rxjs/operators/catchError';

import { GET_INFO, GetCFInfo } from '../actions/cloud-foundry.actions';
import { NormalizedResponse } from '../types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../types/request.types';
import { environment } from './../../../environments/environment';
import { AppState } from './../app-state';
import { cfInfoSchemaKey } from '../helpers/entity-factory';

@Injectable()
export class CloudFoundryEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  fetchInfo$ = this.actions$.ofType<GetCFInfo>(GET_INFO).pipe(
    flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: cfInfoSchemaKey,
        type: action.type
      };
      this.store.dispatch(new StartRequestAction(apiAction, actionType));
      const headers = new Headers({ 'x-cap-cnsi-list': action.cfGuid });
      const requestArgs = {
        headers: headers
      };
      return this.http
        .get(`/pp/${this.proxyAPIVersion}/proxy/v2/info`, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [cfInfoSchemaKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.cfGuid;

            mappedData.entities[cfInfoSchemaKey][id] = {
              entity: info[id],
              metadata: {}
            };
            mappedData.result.push(id);
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
