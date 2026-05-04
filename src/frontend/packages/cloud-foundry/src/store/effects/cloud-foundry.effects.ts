import { HttpClient } from '@angular/common/http';
import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { environment } from '../../../../core/src/environments/environment.prod';
import { entityCatalog } from '../../../../store/src/entity-catalog/entity-catalog';
import { NormalizedResponse } from '../../../../store/src/types/api.types';
import {
  StartRequestAction,
  WrapperRequestActionFailed,
  WrapperRequestActionSuccess,
} from '../../../../store/src/types/request.types';
import { GET_CF_INFO, GetCFInfo } from '../../actions/cloud-foundry.actions';
import { CFAppState } from '../../cf-app-state';

@Injectable({
  providedIn: 'root'
})
export class CloudFoundryEffects {
  private http = inject(HttpClient);
  private actions$ = inject(Actions);
  private store = inject<Store<CFAppState>>(Store);
  private appRef = inject(ApplicationRef);

  proxyAPIVersion = environment.proxyAPIVersion;

  
  // Hits the Stratos-native V3-only handler at GET /pp/v1/cf/info/<guid>.
  // Replaces the legacy /pp/v1/proxy/v2/info passthrough so no frontend
  // call reaches CF v2 directly. The response shape mirrors the legacy
  // ICfV2Info wire shape (snake_case fields: api_version,
  // app_ssh_endpoint, app_ssh_host_key_fingerprint, etc.) — values are
  // sourced exclusively from /v3/info + the unversioned API root /
  // (where SSH host_key_fingerprint and oauth_client live in
  // links.app_ssh.meta).
  fetchInfo$ = createEffect(() => this.actions$.pipe(
    ofType<GetCFInfo>(GET_CF_INFO),
    flatMap(action => {
      const actionType = 'fetch';
      const catalogEntity = entityCatalog.getEntity(action.endpointType, action.entityType);
      const cfInfoKey = catalogEntity.entityKey;
      this.store.dispatch(new StartRequestAction(action, actionType));
      const url = `/pp/${this.proxyAPIVersion}/cf/info/${action.guid}`;
      return this.http
        .get<any>(url)
        .pipe(
          mergeMap((info: any) => {
            const mappedData = {
              entities: { [cfInfoKey]: {} },
              result: []
            } as NormalizedResponse;
            const id = action.guid;

            mappedData.entities[cfInfoKey][id] = {
              entity: info,
              metadata: {}
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
                eventCode: error.status ? error.status + '' : '500',
                message: 'Cloud Foundry Info request error',
                error
              })
            ];
          })
        );
    })
  ));
}
