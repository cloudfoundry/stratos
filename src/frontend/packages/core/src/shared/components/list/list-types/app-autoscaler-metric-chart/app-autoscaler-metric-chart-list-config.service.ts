import { AppAutoscalerMetricChartCardComponent } from './app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import { AppAutoscalerMetricChartDataSource } from './app-autoscaler-metric-chart-data-source';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppState } from '../../../../../../../store/src/app-state';
import { EntityInfo } from '../../../../../../../store/src/types/api.types';
import { ListViewTypes } from '../../list.component.types';
import { ITimeRange, MetricQueryType } from '../../../../../shared/services/metrics-range-selector.types';
import { ITableColumn } from '../../list-table/table.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { APIResource } from '../../../../../../../store/src/types/api.types';

@Injectable()
export class AppAutoscalerMetricChartListConfigService extends BaseCfListConfig<APIResource<any>> {
  autoscalerMetricSource: AppAutoscalerMetricChartDataSource;
  cardComponent = AppAutoscalerMetricChartCardComponent;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  columns: Array<ITableColumn<EntityInfo>> = [
    {
      columnId: 'name',
      headerCell: () => 'Metric type',
      cellDefinition: {
        getValue: (row: any) => row.metadata.guid
      },
      cellFlex: '2'
    }
  ];
  text = {
    title: null,
    noEntries: 'There are no metrics defined in the policy'
  };

  showMetricsRange = true;
  pollInterval = 60000;
  selectedTimeValue = '30:minute';
  times: ITimeRange[] = [
    {
      value: '30:minute',
      label: 'The past 30 minutes',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '1:hour',
      label: 'The past 1 hour',
      queryType: MetricQueryType.QUERY
    },
    {
      value: '2:hour',
      label: 'The past 2 hours',
      queryType: MetricQueryType.QUERY
    },
    {
      label: 'Custom time window',
      queryType: MetricQueryType.RANGE_QUERY
    }
  ];

  constructor(private store: Store<AppState>, private appService: ApplicationService) {
    super();
    this.autoscalerMetricSource = new AppAutoscalerMetricChartDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getDataSource = () => this.autoscalerMetricSource;
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.columns;
}
