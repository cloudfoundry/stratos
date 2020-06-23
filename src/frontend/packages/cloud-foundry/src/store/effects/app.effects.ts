import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { first, map } from 'rxjs/operators';

import { endpointHasMetrics } from '../../../../core/src/features/endpoints/endpoint-helpers';
import { EndpointOnlyAppState } from '../../../../store/src/app-state';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { ASSIGN_ROUTE_SUCCESS } from '../../actions/application-service-routes.actions';
import { CF_APP_UPDATE_SUCCESS, UpdateExistingApplication } from '../../actions/application.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import {
  createAppInstancesMetricAction,
} from '../../shared/components/list/list-types/app-instance/cf-app-instances-config.service';

@Injectable()
export class AppEffects {

  constructor(
    private actions$: Actions,
    private store: Store<EndpointOnlyAppState>,
  ) { }

  @Effect({ dispatch: false }) updateSummary$ = this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(ASSIGN_ROUTE_SUCCESS),
    map(action => {
      cfEntityCatalog.appSummary.api.get(action.apiAction.guid, action.apiAction.endpointGuid)
    }),
  );

  @Effect({ dispatch: false }) clearCellMetrics$ = this.actions$.pipe(
    ofType<APISuccessOrFailedAction>(CF_APP_UPDATE_SUCCESS),
    map(action => {
      // User's can scale down instances and previous instance data is kept in store, when the user scales up again this stale data can
      // be incorrectly shown straight away. In order to work around this fetch the latest metrics again when scaling up
      // Note - If this happens within the metrics update time period (60 seconds) the stale one is returned again, unfortunately there's
      // no way to work around this.
      const updateAction: UpdateExistingApplication = action.apiAction as UpdateExistingApplication;
      if (!!updateAction.existingApplication && updateAction.newApplication.instances > updateAction.existingApplication.instances) {
        // First check that we have a metrics endpoint associated with this cf
        endpointHasMetrics(updateAction.endpointGuid, this.store).pipe(first()).subscribe(hasMetrics => {
          if (hasMetrics) {
            this.store.dispatch(createAppInstancesMetricAction(updateAction.guid, updateAction.endpointGuid));
          }
        });
      }
    }),
  );
}
