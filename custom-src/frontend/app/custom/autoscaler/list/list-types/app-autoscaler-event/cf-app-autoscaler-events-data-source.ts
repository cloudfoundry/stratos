import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../shared/components/list/list.component.types';
import { GetAppAutoscalerScalingHistoryAction } from '../../../app-autoscaler.actions';
import { AutoscalerEvent } from '../../../app-autoscaler.types';
import { appAutoscalerScalingHistorySchemaKey } from '../../../autoscaler.store.module';

export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource<AutoscalerEvent>> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource<AutoscalerEvent>>
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
        isLocal: false,
        listConfig
      }
    );
  }
}
