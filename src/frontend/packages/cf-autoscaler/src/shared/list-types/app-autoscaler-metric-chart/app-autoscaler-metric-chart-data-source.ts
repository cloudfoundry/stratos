import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerPolicyTriggerAction } from '../../../store/app-autoscaler.actions';
import { AppScalingTrigger } from '../../../store/app-autoscaler.types';
import { autoscalerEntityFactory } from '../../../store/autoscaler-entity-factory';


export class AppAutoscalerMetricChartDataSource extends ListDataSource<APIResource<AppScalingTrigger>> {
  action: any;
  constructor(
    store: Store<CFAppState>,
    cfGuid: string,
    appGuid: string,
    listConfig: IListConfig<APIResource<AppScalingTrigger>>,
    metricsRangeService: MetricsRangeSelectorService
  ) {
    const action = new GetAppAutoscalerPolicyTriggerAction(null, appGuid, cfGuid);
    super(
      {
        store,
        action,
        schema: autoscalerEntityFactory(action.entityType),
        getRowUniqueId: getRowMetadata,
        paginationKey: action.paginationKey,
        isLocal: true,
        listConfig,
        refresh: () => {
          if (this.metricsAction.windowValue) {
            this.metricsAction = metricsRangeService.getNewTimeWindowAction(this.metricsAction, this.metricsAction.windowValue);
          }
          this.store.dispatch(this.metricsAction);
        }
      }
    );
  }
}
