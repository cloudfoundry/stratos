import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ListDataSource } from '../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { AddParams } from '../../../../../store/src/actions/pagination.actions';
import { APIResource } from '../../../../../store/src/types/api.types';
import { GetAppAutoscalerScalingHistoryAction } from '../../../store/app-autoscaler.actions';
import { AppAutoscalerEvent } from '../../../store/app-autoscaler.types';
import { appAutoscalerScalingHistoryEntityType, autoscalerEntityFactory } from '../../../store/autoscaler-entity-factory';


export class CfAppAutoscalerEventsDataSource extends ListDataSource<APIResource<AppAutoscalerEvent>> {
  action: any;
  constructor(
    store: Store<CFAppState>,
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
            'start-time': newAction.query.params.start + '000000000',
            'end-time': newAction.query.params.end + '000000000',
          }));
        }
      }
    );
  }

}
