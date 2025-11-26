import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ListDataSource } from '@stratosui/core';
import { MetricsRangeSelectorService, type IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerPolicyTriggerAction } from '../../../store/app-autoscaler.actions';
import type { AppScalingTrigger } from '../../../store/app-autoscaler.types';
import { autoscalerEntityFactory } from '../../../store/autoscaler-entity-factory';


export class AppAutoscalerMetricChartDataSource extends ListDataSource<APIResource<AppScalingTrigger>> {
  declare action: GetAppAutoscalerPolicyTriggerAction;
  constructor(
    store: Store<GeneralEntityAppState>,
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
