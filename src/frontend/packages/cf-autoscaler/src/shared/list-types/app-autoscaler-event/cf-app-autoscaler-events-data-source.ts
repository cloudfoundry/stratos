import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ListDataSource } from '@stratosui/core';
import { MetricsRangeSelectorService, type IListConfig } from '@stratosui/core';
import { AddParams } from '../../../../../store/src/actions/pagination.actions';
import type { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerScalingHistoryAction } from '../../../store/app-autoscaler.actions';
import type { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { appAutoscalerScalingHistoryEntityType, autoscalerEntityFactory } from '../../../store/autoscaler-entity-factory';


export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource<AppAutoscalerEvent>> {
  declare action: GetAppAutoscalerScalingHistoryAction;
  constructor(
    store: Store<GeneralEntityAppState>,
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
        schema: autoscalerEntityFactory(appAutoscalerScalingHistoryEntityType),
        getRowUniqueId: getRowMetadata,
        paginationKey: action.paginationKey,
        isLocal: false,
        listConfig,
        // why we don't pass action and rely on metricsAction attribute?
        refresh: () => {
          if (this.metricsAction.windowValue) {
            this.metricsAction = metricsRangeService.getNewTimeWindowAction(this.metricsAction, this.metricsAction.windowValue);
          }
          this.store.dispatch(this.metricsAction);
        },
        handleTimeWindowChange: (newAction: GetAppAutoscalerScalingHistoryAction) => {
          this.store.dispatch(new AddParams(newAction, this.paginationKey, {
            'start-time': `${newAction.query.params.start}000000000`,
            'end-time': `${newAction.query.params.end}000000000`,
          }));
        }
      }
    );
  }

}
