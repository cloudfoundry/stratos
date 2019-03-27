import { Store } from '@ngrx/store';

import { GetAppAutoscalerScalingHistoryAction } from '../../../../../../../store/src/actions/app-autoscaler.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { appAutoscalerScalingHistorySchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';

export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
  ) {
    const paginationKey = `app-autoscaler-events:${cfGuid}${appGuid}`;
    const action = new GetAppAutoscalerScalingHistoryAction(paginationKey, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: entityFactory(appAutoscalerScalingHistorySchemaKey),
        getRowUniqueId: getRowMetadata,
        paginationKey,
      }
    );
  }
}
