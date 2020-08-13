import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { ApplicationService } from '../../../../../cloud-foundry/src/features/applications/application.service';
import {
  BaseCfListConfig,
} from '../../../../../cloud-foundry/src/shared/components/list/list-types/base-cf/base-cf-list-config';
import { ITableColumn } from '../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../core/src/shared/components/list/list.component.types';
import { MetricsRangeSelectorService } from '../../../../../core/src/shared/services/metrics-range-selector.service';
import { ITimeRange } from '../../../../../core/src/shared/services/metrics-range-selector.types';
import { ListView } from '../../../../../store/src/actions/list.actions';
import { APIResource } from '../../../../../store/src/types/api.types';
import { MetricQueryType } from '../../../../../store/src/types/metric.types';
import { AutoscalerConstants } from '../../../core/autoscaler-helpers/autoscaler-util';
import { AppScalingTrigger } from '../../../store/app-autoscaler.types';
import {
  AppAutoscalerMetricChartCardComponent,
} from './app-autoscaler-metric-chart-card/app-autoscaler-metric-chart-card.component';
import { AppAutoscalerMetricChartDataSource } from './app-autoscaler-metric-chart-data-source';


@Injectable()
export class AppAutoscalerMetricChartListConfigService extends BaseCfListConfig<APIResource<AppScalingTrigger>> {
  autoscalerMetricSource: AppAutoscalerMetricChartDataSource;
  cardComponent = AppAutoscalerMetricChartCardComponent;
  viewType = ListViewTypes.CARD_ONLY;
  defaultView = 'cards' as ListView;
  columns: Array<ITableColumn<APIResource<AppScalingTrigger>>> = [
    {
      columnId: 'name',
      headerCell: () => 'Metric type',
      cellDefinition: {
        getValue: (row) => AutoscalerConstants.getMetricFromMetricId(row.metadata.guid)
      },
      cellFlex: '2'
    }
  ];
  text = {
    title: null,
    noEntries: 'There are no metrics defined in the policy'
  };

  showCustomTime = true;
  customTimePollingInterval = 60000;
  customTimeInitialValue = '30:minute';
  customTimeWindows: ITimeRange[] = [
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

  private twoHours = 1000 * 60 * 60 * 2;
  customTimeValidation = (start: moment.Moment, end: moment.Moment) => {
    if (!end || !start) {
      return ' ';
    }
    if (!start.isBefore(end)) {
      return 'Start date must be before end date.';
    }
    if (end.diff(start) > this.twoHours) {
      return 'Time window must be two hours or less';
    }
  }

  constructor(
    private store: Store<CFAppState>,
    private appService: ApplicationService,
    metricsRangeService: MetricsRangeSelectorService) {
    super();
    this.autoscalerMetricSource = new AppAutoscalerMetricChartDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
      this,
      metricsRangeService
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getDataSource = () => this.autoscalerMetricSource;
  getMultiFiltersConfigs = () => [];
  getColumns = () => this.columns;
}
