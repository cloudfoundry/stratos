import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { MetricsAction, MetricQueryType, FetchCFMetricsAction, FetchApplicationMetricsAction } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { ChartSeries, IMetrics, MetricResultTypes } from './../../../store/types/base-metric.types';
import { EntityMonitorFactory } from './../../monitors/entity-monitor.factory.service';
import { MetricsChartTypes } from './metrics-chart.types';
import { MetricsChartManager } from './metrics.component.manager';

import * as moment from 'moment';

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
export class MetricsChartComponent implements OnInit, OnDestroy, OnChanges {
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

  private commitDate(date: moment.Moment, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (oldDate && date.isSame(oldDate)) {
      return;
    }
    this.startEnd[index] = date;
    const [start, end] = this.startEnd;
    if (start && end) {
      const startUnix = start.unix();
      const endUnix = end.unix();
      const rangeParm = `&start=${startUnix}&end=${endUnix}&step=345`;
      const oldAction = this.metricsConfig.metricsAction;
      const action = new FetchApplicationMetricsAction(
        oldAction.guid,
        oldAction.cfGuid,
        this.metricsConfig.metricsAction.query + rangeParm,
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
    const now = moment(moment.now());
    this.start = moment(now).subtract(1, 'weeks');
    this.end = now;
    // this.setup(this.metricsConfig.metricsAction);
  }

  private setup(action: MetricsAction) {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
    const metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      action.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );
    this.results$ = metricsMonitor.entity$.pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig);
        if (this.metricsConfig.sort) {
          metricsArray.sort(this.metricsConfig.sort);
        }
        return metricsArray;
      })
    );
    this.store.dispatch(action);
    this.pollSub = metricsMonitor
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

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes)
    if (changes.start || changes.end) {
      const startMs = (changes.start.currentValue as moment.Moment).valueOf();
      const endMs = (changes.end.currentValue as moment.Moment).valueOf();
      const rangeParm = `&start=${startMs}&end=${endMs}`;
      const oldAction = this.metricsConfig.metricsAction;
      const action = new FetchCFMetricsAction(
        oldAction.guid,
        this.metricsConfig.metricsAction.query + rangeParm,
        MetricQueryType.RANGE_QUERY
      );
      this.commit = this.getCommitFn(action);
      this.commit();
    } else {
      this.commit = null;
    }
  }
}
