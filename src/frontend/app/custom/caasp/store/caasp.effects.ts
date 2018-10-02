import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { environment } from '../../../../environments/environment';
import { AppState } from '../../../store/app-state';
import { NormalizedResponse } from '../../../store/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../store/types/request.types';
import { CAASP_INFO_ENTITY_KEY, GET_INFO, GetCaaspInfo } from './caasp.actions';

import { flatMap, mergeMap, catchError } from 'rxjs/operators';

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

            // mappedData.entities[CAASP_INFO_ENTITY_KEY][id] = {
            //   entity: info,
            //   metadata: {}
            // };

            mappedData.entities[CAASP_INFO_ENTITY_KEY][id] = info;


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
