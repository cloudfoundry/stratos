import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../shared/components/list/list.component.types';
import { GetAppAutoscalerScalingHistoryAction } from '../../../app-autoscaler.actions';
import { AppAutoscalerEvent } from '../../../app-autoscaler.types';
import { appAutoscalerScalingHistorySchemaKey } from '../../../autoscaler.store.module';

export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource<AppAutoscalerEvent>> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource<AppAutoscalerEvent>>
  ) {
    const action = new GetAppAutoscalerScalingHistoryAction(null, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: entityFactory(appAutoscalerScalingHistorySchemaKey),
        getRowUniqueId: getRowMetadata,
        paginationKey: action.paginationKey,
        isLocal: false,
        listConfig
      }
    );
  }
}
