import { IMetricMatrixResult, IMetrics, MetricResultTypes } from './../../../store/types/base-metric.types';
import { map, filter } from 'rxjs/operators';
import { metricSchema } from './../../../store/actions/metrics.actions';
import { EntityMonitorFactory } from './../../monitors/entity-monitor.factory.service';
import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { MetricsAction, FetchApplicationMetricsAction } from '../../../store/actions/metrics.actions';
import { ApplicationService } from '../../../features/applications/application.service';
import { MeticsChartManager } from './metrics.component.manager';
import { MetricsChartTypes } from './metrics-chart.types';

export interface MetricsConfig<T = any> {
  metricsAction: MetricsAction;
  getSeriesName: (T) => string;
  mapSeriesItemName?: (any) => string;
  mapSeriesItemValue?: (any) => any;
}
export interface MetricsChartConfig {
  // Make an enum for this.
  chartType: MetricsChartTypes;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.component.html',
  styleUrls: ['./metrics-chart.component.scss']
})
export class MetricsChartComponent implements OnInit {
  @Input('metricsConfig')
  public metricsConfig: MetricsConfig;
  @Input('chartConfig')
  public chartConfig: MetricsChartConfig;

  public chartTypes = MetricsChartTypes;

  public results$;
  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    private appService: ApplicationService
  ) { }

  ngOnInit() {
    this.store.dispatch(this.metricsConfig.metricsAction);
    const metrics$ = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchema.key,
      metricSchema
    )
    this.results$ = metrics$.entity$.pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        return this.mapMetricsToChartData(metrics, this.metricsConfig);
      })
    )
  }

  private mapMetricsToChartData(metrics: IMetrics, metricsConfig: MetricsConfig) {
    switch (metrics.resultType) {
      case MetricResultTypes.MATRIX:
        return MeticsChartManager.mapMatrix(metrics, metricsConfig);
      case MetricResultTypes.SCALAR:
      case MetricResultTypes.STRING:
      case MetricResultTypes.VECTOR:
      default:
        throw `Counld not find chart data mapper for metrics type ${metrics.resultType}`;
    }

  }
}
