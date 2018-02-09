import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { flatMap, mergeMap } from 'rxjs/operators';

import {
  CF_INFO_ENTITY_KEY,
  GET_INFO,
  GetEndpointInfo
} from '../actions/cloud-foundry.actions';
import { NormalizedResponse } from '../types/api.types';
import { GITHUB_BRANCHES_ENTITY_KEY } from '../types/deploy-application.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess
} from '../types/request.types';
import { environment } from './../../../environments/environment';
import { AppState } from './../app-state';
import { catchError } from 'rxjs/operators/catchError';

@Injectable()
export class CloudFoundryEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  @Effect()
  fetchInfo$ = this.actions$.ofType<GetEndpointInfo>(GET_INFO).pipe(
    flatMap(action => {
      const actionType = 'fetch';
      const apiAction = {
        entityKey: CF_INFO_ENTITY_KEY,
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
              entities: { cloudFoundryInfo: {} },
              result: []
            } as NormalizedResponse;
            const id = action.cfGuid;

            mappedData.entities[CF_INFO_ENTITY_KEY][id] = {
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
