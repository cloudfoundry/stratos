import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';

import { WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { CF_APP_UPDATE_SUCCESS, UpdateExistingApplication } from '../../actions/application.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';

// CF effects retention (wave-3 CF-effects audit, 2026-05-12):
// Retained — CF_APP_UPDATE_SUCCESS auto-emits whenever
// UpdateExistingApplication completes via the request pipeline, and
// the parent action is dispatched live via cfEntityCatalog.application.api.update
// from application.service.ts:341 and AppVariablesEffect at
// app-variables.effects.ts:22. Effect refreshes env-vars/stats/summary
// metadata after the underlying app update.
@Injectable()
export class UpdateAppEffects {
  private actions$ = inject(Actions);
  private appRef = inject(ApplicationRef);


   UpdateAppInStore$ = createEffect(() => this.actions$.pipe(
    ofType<WrapperRequestActionSuccess>(CF_APP_UPDATE_SUCCESS),
    mergeMap((action: WrapperRequestActionSuccess): any[] => {
      const updateAction = action.apiAction as UpdateExistingApplication;
      const updateEntities = updateAction.updateEntities || [AppMetadataTypes.ENV_VARS, AppMetadataTypes.STATS, AppMetadataTypes.SUMMARY];
      const actions: any[] = [];
      updateEntities.forEach((updateEntity: any) => {
        switch (updateEntity) {
          case AppMetadataTypes.ENV_VARS:
            // This is done so the app metadata env vars environment_json matches that of the app
            actions.push(cfEntityCatalog.appEnvVar.actions.getMultiple(action.apiAction.guid, action.apiAction.endpointGuid));
            break;
          case AppMetadataTypes.STATS: {
            const statsAction = cfEntityCatalog.appStats.actions.getMultiple(
              action.apiAction.guid,
              action.apiAction.endpointGuid as string
            );
            // Application has changed and the associated app stats need to also be updated.
            // Apps that are started can just make the stats call to update cached stats, however this call will fail for stopped apps.
            // For those cases create a fake stats request response that should result in the same thing
            if (updateAction.newApplication.state === 'STOPPED') {
              actions.push(new WrapperRequestActionSuccess({ entities: {}, result: [] }, statsAction, 'fetch', 0, 0));
            } else {
              actions.push(statsAction);
            }
            break;
          }
          case AppMetadataTypes.SUMMARY:
            actions.push(cfEntityCatalog.appSummary.actions.get(action.apiAction.guid, action.apiAction.endpointGuid));
            break;
        }
      });

      this.appRef.tick();
      return actions;
    })));
}
