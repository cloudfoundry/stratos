import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ChartComponent } from '@swimlane/ngx-charts';
import { filter, map, tap, delay, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ApplicationService } from '../../../features/applications/application.service';
import { MetricsAction } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { ChartSeries, IMetrics, MetricResultTypes } from './../../../store/types/base-metric.types';
import { EntityMonitorFactory } from './../../monitors/entity-monitor.factory.service';
import { MetricsChartTypes } from './metrics-chart.types';
import { MetricsChartManager } from './metrics.component.manager';

export interface MetricsConfig<T = any> {
  metricsAction: MetricsAction;
  getSeriesName: (T) => string;
  mapSeriesItemName?: (value) => string | Date;
  mapSeriesItemValue?: (value) => any;
  sort?: (a: ChartSeries<T>, b: ChartSeries<T>) => number;
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
export class MetricsChartComponent implements OnInit, OnDestroy {
  @Input('metricsConfig')
  public metricsConfig: MetricsConfig;
  @Input('chartConfig')
  public chartConfig: MetricsChartConfig;
  @Input('title')
  public title: string;

  public chartTypes = MetricsChartTypes;

  private pollSub: Subscription;

  public results$;
  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory,
    private appService: ApplicationService
  ) { }

  ngOnInit() {
    const metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );
    this.results$ = metricsMonitor.entity$.pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig)
        if (this.metricsConfig.sort) {
          metricsArray.sort(this.metricsConfig.sort);
        }
        return metricsArray;
      })
    );
    this.store.dispatch(this.metricsConfig.metricsAction);
    this.pollSub = metricsMonitor.poll(
      30000,
      () => this.store.dispatch(this.metricsConfig.metricsAction),
      request => ({ busy: request.fetching, error: request.error, message: request.message })
    )
      .subscribe();
  }

  ngOnDestroy() {
    this.pollSub.unsubscribe();
  }

  private mapMetricsToChartData(metrics: IMetrics, metricsConfig: MetricsConfig) {
    switch (metrics.resultType) {
      case MetricResultTypes.MATRIX:
        return MetricsChartManager.mapMatrix(metrics, metricsConfig);
      case MetricResultTypes.VECTOR:
        return MetricsChartManager.mapVector(metrics, metricsConfig);
      case MetricResultTypes.SCALAR:
      case MetricResultTypes.STRING:
      default:
        throw new Error(`Could not find chart data mapper for metrics type ${metrics.resultType}`);
    }

  }
}
