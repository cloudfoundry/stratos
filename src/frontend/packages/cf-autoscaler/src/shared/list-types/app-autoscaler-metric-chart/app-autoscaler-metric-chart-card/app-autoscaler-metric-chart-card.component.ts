import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ApplicationService } from '../../../../../../cloud-foundry/src/features/applications/application.service';
import { CardCell, IListRowCell } from '../../../../../../core/src/shared/components/list/list.types';
import { AppState } from '../../../../../../store/src/app-state';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { AutoscalerConstants, buildLegendData } from '../../../../core/autoscaler-helpers/autoscaler-util';
import { AutoscalerPaginationParams, GetAppAutoscalerAppMetricAction } from '../../../../store/app-autoscaler.actions';
import {
  AppAutoscalerMetricData,
  AppAutoscalerMetricDataPoint,
  AppScalingTrigger,
} from '../../../../store/app-autoscaler.types';
import { appAutoscalerAppMetricEntityType, autoscalerEntityFactory } from '../../../../store/autoscaler-entity-factory';


@Component({
  selector: 'app-app-autoscaler-metric-chart-card',
  templateUrl: './app-autoscaler-metric-chart-card.component.html',
  styleUrls: ['./app-autoscaler-metric-chart-card.component.scss']
})

export class AppAutoscalerMetricChartCardComponent extends CardCell<APIResource<AppScalingTrigger>> implements IListRowCell {
  static columns = 1;
  listData: {
    label: string;
    data$: Observable<string>;
    customStyle?: string;
  }[];

  envVarUrl: string;

  comboBarScheme = {
    name: 'singleLightBlue',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };
  lineChartScheme = {
    name: 'coolthree',
    selectable: true,
    group: 'Ordinal',
    domain: ['#01579b']
  };

  public paramsMetricsEnd: number = (new Date()).getTime();
  public paramsMetricsStart: number = this.paramsMetricsEnd - 30 * 60 * 1000;
  public paramsMetrics: AutoscalerPaginationParams = {
    'start-time': this.paramsMetricsStart + '000000',
    'end-time': this.paramsMetricsEnd + '000000',
    page: '1',
    'results-per-page': '10000000',
    'order-direction': 'asc'
  };

  public metricType: string;

  @Input('row')
  set row(row: APIResource<AppScalingTrigger>) {
    if (row) {
      if (row.entity.query && row.entity.query.params) {
        this.paramsMetricsStart = row.entity.query.params.start * 1000;
        this.paramsMetricsEnd = row.entity.query.params.end * 1000;
        this.paramsMetrics['start-time'] = this.paramsMetricsStart + '000000';
        this.paramsMetrics['end-time'] = this.paramsMetricsEnd + '000000';

        this.appAutoscalerAppMetricLegend = this.getLegend2(row.entity);
        this.metricType = AutoscalerConstants.getMetricFromMetricId(row.metadata.guid);
        this.metricData$ = this.getAppMetric(this.metricType, row.entity, this.paramsMetrics);
      }
    }
  }

  constructor(
    private appService: ApplicationService,
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
  ) {
    super();
  }

  public metricData$: Observable<any>;
  public appAutoscalerAppMetricLegend;

  getLegend2(trigger: AppScalingTrigger) {
    const legendColor = buildLegendData(trigger);
    const legendValue: AppAutoscalerMetricDataPoint[] = [];
    legendColor.map((item) => {
      legendValue.push({
        name: item.name,
        value: 1
      });
    });
    return {
      legendValue,
      legendColor
    };
  }

  getAppMetric(metricName: string, trigger: AppScalingTrigger, params: AutoscalerPaginationParams): Observable<AppAutoscalerMetricData[]> {
    const action = new GetAppAutoscalerAppMetricAction(this.appService.appGuid,
      this.appService.cfGuid, metricName, false, trigger, params);
    this.store.dispatch(action);
    return getPaginationObservables<AppAutoscalerMetricData>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        autoscalerEntityFactory(appAutoscalerAppMetricEntityType),
        true
      )
    }, true).entities$.pipe(
      filter(entities => !!entities)
    );
  }

}
