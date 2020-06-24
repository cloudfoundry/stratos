import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';

import { WrapperRequestActionSuccess } from '../../../../store/src/types/request.types';
import { AppMetadataTypes } from '../../actions/app-metadata.actions';
import { CF_APP_UPDATE_SUCCESS, UpdateExistingApplication } from '../../actions/application.actions';
import { cfEntityCatalog } from '../../cf-entity-catalog';

@Injectable()
export class UpdateAppEffects {

  constructor(
    private actions$: Actions
  ) {
  }

  @Effect() UpdateAppInStore$ = this.actions$.pipe(
    ofType<WrapperRequestActionSuccess>(CF_APP_UPDATE_SUCCESS),
    mergeMap((action: WrapperRequestActionSuccess) => {
      const updateAction = action.apiAction as UpdateExistingApplication;
      const updateEntities = updateAction.updateEntities || [AppMetadataTypes.ENV_VARS, AppMetadataTypes.STATS, AppMetadataTypes.SUMMARY];
      const actions = [];
      updateEntities.forEach(updateEntity => {
        switch (updateEntity) {
          case AppMetadataTypes.ENV_VARS:
            // This is done so the app metadata env vars environment_json matches that of the app
            actions.push(cfEntityCatalog.appEnvVar.actions.getMultiple(action.apiAction.guid, action.apiAction.endpointGuid));
            break;
          case AppMetadataTypes.STATS:
            const statsAction = cfEntityCatalog.appStats.actions.getMultiple(action.apiAction.guid, action.apiAction.endpointGuid as string)
            // Application has changed and the associated app stats need to also be updated.
            // Apps that are started can just make the stats call to update cached stats, however this call will fail for stopped apps.
            // For those cases create a fake stats request response that should result in the same thing
            if (updateAction.newApplication.state === 'STOPPED') {
              actions.push(new WrapperRequestActionSuccess({ entities: {}, result: [] }, statsAction, 'fetch', 0, 0));
            } else {
              actions.push(statsAction);
            }
            break;
          case AppMetadataTypes.SUMMARY:
            actions.push(cfEntityCatalog.appSummary.actions.get(action.apiAction.guid, action.apiAction.endpointGuid));
            break;
        }
      });

      return actions;
    }));
}
