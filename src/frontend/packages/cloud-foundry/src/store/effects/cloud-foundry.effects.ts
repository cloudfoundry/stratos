import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { environment } from '@stratosui/core';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import type { NormalizedResponse } from '../../../../store/src/types/api.types';
import { createPartialMetadata } from '../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../store/src/types/request.types';
import { GET_CF_INFO, type GetCFInfo } from '../../actions/cloud-foundry.actions';
import type { CFAppState } from '../../cf-app-state';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryEffects {
  proxyAPIVersion = environment.proxyAPIVersion;
  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store,
    private appRef: ApplicationRef
  ) { }

  
  fetchInfo$ = createEffect(() => this.actions$.pipe(
    ofType<GetCFInfo>(GET_CF_INFO),
    flatMap(action => {
      const actionType = 'fetch';
      const catalogEntity = entityCatalog.getEntity(action.endpointType, action.entityType);
      const cfInfoKey = catalogEntity.entityKey;
      this.store.dispatch(new StartRequestAction(action, actionType));
      const requestArgs = {
        headers: { 'x-cap-cnsi-list': action.guid }
      };
      const url = `/pp/${this.proxyAPIVersion}/proxy/v2/info`;
      return this.http
        .get<Record<string, unknown>>(url, requestArgs)
        .pipe(
          mergeMap((info: Record<string, unknown>) => {
            const mappedData = {
              entities: { [cfInfoKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.guid;

            mappedData.entities[cfInfoKey][id] = {
              entity: info[id],
              metadata: createPartialMetadata()
            };
            mappedData.result.push(id);
            this.appRef.tick();
            return [
              new WrapperRequestActionSuccess(mappedData, action, actionType)
            ];
          }),
          catchError(error => {
            this.appRef.tick();
            return [
              new WrapperRequestActionFailed(error.message, action, actionType, {
                endpointIds: [action.guid],
                url: error.url || url,
                eventCode: error.status ? `${error.status}` : '500',
                message: 'Cloud Foundry Info request error',
                error
              })
            ];
          })
        );
    })
  ));
}
