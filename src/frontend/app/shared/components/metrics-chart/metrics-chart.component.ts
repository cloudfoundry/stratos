import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { FetchApplicationMetricsAction, MetricQueryType, MetricsAction, MetricQueryConfig } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { EntityMonitor } from '../../monitors/entity-monitor';
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
  @Input()
  public metricsConfig: MetricsConfig;
  @Input()
  public chartConfig: MetricsChartConfig;
  @Input()
  public title: string;

  public chartTypes = MetricsChartTypes;

  private startEnd: [moment.Moment, moment.Moment] = [null, null];

  private pollSub: Subscription;

  private commit: Function = null;

  public results$;

  private readonly startIndex = 0;
  private readonly endIndex = 1;
  public metricsMonitor: EntityMonitor<IMetrics>;

  private commitDate(date: moment.Moment, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (oldDate && date.isSame(oldDate)) {
      return;
    }
    this.startEnd[index] = date;
    const [start, end] = this.startEnd;
    if (start && end) {
      const startUnix = start.unix() + '';
      const endUnix = end.unix() + '';
      const oldAction = this.metricsConfig.metricsAction;
      const action = new FetchApplicationMetricsAction(
        oldAction.guid,
        oldAction.cfGuid,
        new MetricQueryConfig(this.metricsConfig.metricsAction.query.metric, {
          start: startUnix,
          end: endUnix,
          step: '365'
        }),
        MetricQueryType.RANGE_QUERY
      );
      this.commit = this.getCommitFn(action);
      this.commit();
    }
  }

  set start(start: moment.Moment) {
    this.commitDate(start, 'start');
  }

  get start() {
    return this.startEnd[this.startIndex];
  }

  set end(end: moment.Moment) {
    this.commitDate(end, 'end');
  }

  get end() {
    return this.startEnd[this.endIndex];
  }

  constructor(
    private store: Store<AppState>,
    private entityMonitorFactory: EntityMonitorFactory
  ) { }

  ngOnInit() {
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );
    this.results$ = this.metricsMonitor.entity$.pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig);
        if (!metricsArray.length) {
          return null;
        }
        if (this.metricsConfig.sort) {
          metricsArray.sort(this.metricsConfig.sort);
        }
        return metricsArray;
      })
    );
    const now = moment(moment.now());
    this.start = moment(now).subtract(1, 'weeks');
    this.end = now;
  }

  private setup(action: MetricsAction) {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
    this.store.dispatch(action);
    this.pollSub = this.metricsMonitor
      .poll(
        30000,
        () => {
          this.store.dispatch(action);
        },
        request => ({ busy: request.fetching, error: request.error, message: request.message })
      ).subscribe();
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

  private getCommitFn(action: MetricsAction) {
    return () => {
      this.setup(action);
    };
  }
}
