import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { GET_CF_INFO, GetCFInfo } from '../../actions/cloud-foundry.actions';
import { CFAppState } from '../../cf-app-state';
import { entityCatalogue } from '../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { environment } from '../../../../core/src/environments/environment.prod';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import { StartRequestAction, WrapperRequestActionFailed, WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';

@Injectable()
export class CloudFoundryEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: Http,
    private actions$: Actions,
    private store: Store<CFAppState>
  ) { }

  @Effect()
  fetchInfo$ = this.actions$.pipe(
    ofType<GetCFInfo>(GET_CF_INFO),
    flatMap(action => {
      const actionType = 'fetch';
      const catalogueEntity = entityCatalogue.getEntity(action.endpointType, action.entityType);
      const cfInfoKey = catalogueEntity.entityKey;
      this.store.dispatch(new StartRequestAction(action, actionType));
      const headers = new Headers({ 'x-cap-cnsi-list': action.cfGuid });
      const requestArgs = {
        headers
      };
      const url = `/pp/${this.proxyAPIVersion}/proxy/v2/info`;
      return this.http
        .get(url, requestArgs)
        .pipe(
          mergeMap(response => {
            const info = response.json();
            const mappedData = {
              entities: { [cfInfoKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.cfGuid;

            mappedData.entities[cfInfoKey][id] = {
              entity: info[id],
              metadata: {}
            };
            mappedData.result.push(id);
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(error => [
            new WrapperRequestActionFailed(error.message, action, actionType, {
              endpointIds: [action.cfGuid],
              url: error.url || url,
              eventCode: error.status ? error.status + '' : '500',
              message: 'Cloud Foundry Info request error',
              error
            })
          ])
        );
    })
  );
}
