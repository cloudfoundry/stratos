import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { take, defaultIfEmpty, map } from 'rxjs/operators';

import { endpointHasMetrics } from '../../../../core/src/features/endpoints/endpoint-helpers';
import { EndpointOnlyAppState } from '../../../../store/src/app-state';
import { EndpointsDataService } from '../../../../store/src/services/endpoints-data.service';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { ASSIGN_ROUTE_SUCCESS } from '../../actions/application-service-routes.actions';
import { CF_APP_UPDATE_SUCCESS, UpdateExistingApplication } from '../../actions/application.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import {
  createAppInstancesMetricAction,
} from '../../shared/components/list/list-types/app-instance/cf-app-instances-metrics-action';

// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained — ASSIGN_ROUTE_SUCCESS / CF_APP_UPDATE_SUCCESS are still
// auto-emitted by the cfEntityCatalog API request pipeline whenever a
// route is assigned (cfEntityCatalog.application.api.assignRoute, see
// create-application-step3.component.ts:138) or an application is
// updated (cfEntityCatalog.application.api.update, see
// application.service.ts:341 and the AppVariablesEffect at
// app-variables.effects.ts:22). Both side-effects (refresh app summary,
// clear cell metrics on scale-up) still fire at runtime.
@Injectable({
  providedIn: 'root'
})
export class AppEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<EndpointOnlyAppState>>(Store);
  private appRef = inject(ApplicationRef);
  private endpointsService = inject(EndpointsDataService);


   updateSummary$ = createEffect(() => this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(ASSIGN_ROUTE_SUCCESS),
    map(action => {
      cfEntityCatalog.appSummary.api.get(action.apiAction.guid, action.apiAction.endpointGuid);
      this.appRef.tick();
    }),
  ), { dispatch: false });

   clearCellMetrics$ = createEffect(() => this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(CF_APP_UPDATE_SUCCESS),
    map(action => {
      // User's can scale down instances and previous instance data is kept in store, when the user scales up again this stale data can
      // be incorrectly shown straight away. In order to work around this fetch the latest metrics again when scaling up
      // Note - If this happens within the metrics update time period (60 seconds) the stale one is returned again, unfortunately there's
      // no way to work around this.
      const updateAction: UpdateExistingApplication = action.apiAction as UpdateExistingApplication;
      if (!!updateAction.existingApplication && updateAction.newApplication.instances > updateAction.existingApplication.instances) {
        // First check that we have a metrics endpoint associated with this cf
        endpointHasMetrics(updateAction.endpointGuid, this.endpointsService).pipe(take(1), defaultIfEmpty(false)).subscribe(hasMetrics => {
          if (hasMetrics) {
            this.store.dispatch(createAppInstancesMetricAction(updateAction.guid, updateAction.endpointGuid));
          }
          this.appRef.tick();
        });
      } else {
        this.appRef.tick();
      }
    }),
  ), { dispatch: false });
}
