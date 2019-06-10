import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../core/src/features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { AppState } from '../../../../../store/src/app-state';
import { entityFactory } from '../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerScalingHistoryAction } from '../../../store/app-autoscaler.actions';
import { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { appAutoscalerScalingHistorySchemaKey } from '../../../store/autoscaler.store.module';


export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource<AppAutoscalerEvent>> {
  action: any;
  constructor(
    store: Store<AppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource<AppAutoscalerEvent>>,
    metricsRangeService: MetricsRangeSelectorService
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
        listConfig,
        refresh: () =>  {
          if (this.metricsAction.windowValue) {
            this.metricsAction = metricsRangeService.getNewTimeWindowAction(this.metricsAction, this.metricsAction.windowValue);
          }
          this.store.dispatch(this.metricsAction);
        }
      }
    );
  }

}
