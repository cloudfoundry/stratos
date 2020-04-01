import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/src/cf-types';
import { AppMetadataTypes } from '../../../cloud-foundry/src/actions/app-metadata.actions';
import { UPDATE_SUCCESS, UpdateExistingApplication } from '../../../cloud-foundry/src/actions/application.actions';
import { appEnvVarsEntityType, appStatsEntityType, appSummaryEntityType } from '../../../cloud-foundry/src/cf-entity-types';
import { entityCatalog } from '../entity-catalog/entity-catalog.service';
import { WrapperRequestActionSuccess } from '../types/request.types';



@Injectable()
export class UpdateAppEffects {

  constructor(
    private actions$: Actions
  ) {
  }

  @Effect() UpdateAppInStore$ = this.actions$.pipe(
    ofType<WrapperRequestActionSuccess>(UPDATE_SUCCESS),
    mergeMap((action: WrapperRequestActionSuccess) => {
      const updateAction = action.apiAction as UpdateExistingApplication;
      const updateEntities = updateAction.updateEntities || [AppMetadataTypes.ENV_VARS, AppMetadataTypes.STATS, AppMetadataTypes.SUMMARY];
      const actions = [];
      updateEntities.forEach(updateEntity => {
        switch (updateEntity) {
          case AppMetadataTypes.ENV_VARS:
            // This is done so the app metadata env vars environment_json matches that of the app
            const appEnvVarsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appEnvVarsEntityType);
            const actionBuilder = appEnvVarsEntity.actionOrchestrator.getActionBuilder('get');
            const getAppEnvVarsAction = actionBuilder(action.apiAction.guid, action.apiAction.endpointGuid as string);
            actions.push(getAppEnvVarsAction);
            break;
          case AppMetadataTypes.STATS:
            const appStatsEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appStatsEntityType);
            const appStatsActionBuilder = appStatsEntity.actionOrchestrator.getActionBuilder('get');
            const statsAction = appStatsActionBuilder(action.apiAction.guid, action.apiAction.endpointGuid as string);
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
            const appSummaryEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, appSummaryEntityType);
            const appSummaryActionBuilder = appSummaryEntity.actionOrchestrator.getActionBuilder('get');
            const getAppSummaryAction = appSummaryActionBuilder(action.apiAction.guid, action.apiAction.endpointGuid as string);
            actions.push(getAppSummaryAction);
            break;
        }
      });
      return actions;
    }));
}
