import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { FetchApplicationMetricsAction, MetricQueryConfig, MetricQueryType, MetricsAction } from '../../../store/actions/metrics.actions';
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

enum RangeType {
  ROLLING_WINDOW = 'ROLLING_WINDOW',
  START_END = 'START_END'
}

interface ITimeRange {
  value?: string;
  label: string;
  type: RangeType;
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

  public rangeTypes = RangeType;

  public times: ITimeRange[] = [
    {
      value: '5m',
      label: 'The past 5 minutes',
      type: RangeType.ROLLING_WINDOW
    },
    {
      value: '1h',
      label: 'The past hour',
      type: RangeType.ROLLING_WINDOW
    },
    {
      value: '1w',
      label: 'The past week',
      type: RangeType.ROLLING_WINDOW
    },
    {
      label: 'Over a specific period',
      type: RangeType.START_END
    }
  ];

  public selectedTimeRangeValue: ITimeRange;


  private commitDate(date: moment.Moment, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (!date.isValid() || date.isSame(oldDate)) {
      return;
    }
    this.startEnd[index] = date;
    const [start, end] = this.startEnd;
    if (start && end) {
      const startUnix = start.unix();
      const endUnix = end.unix();
      const oldAction = this.metricsConfig.metricsAction;
      this.metricsConfig.metricsAction = new FetchApplicationMetricsAction(
        oldAction.guid,
        oldAction.cfGuid,
        new MetricQueryConfig(this.metricsConfig.metricsAction.query.metric, {
          start: startUnix,
          end: endUnix,
          step: Math.max((endUnix - startUnix) / 100, 0)
        }),
        MetricQueryType.RANGE_QUERY
      );
      this.commit = this.getCommitFn(this.metricsConfig.metricsAction);
      this.commit();
    }
  }

  get selectedTimeRange() {
    return this.selectedTimeRangeValue;
  }

  set selectedTimeRange(timeRange: ITimeRange) {
    this.selectedTimeRangeValue = timeRange;
    if (this.selectedTimeRangeValue.type === RangeType.ROLLING_WINDOW) {
      this.commitWindow(this.selectedTimeRangeValue);
    }
  }

  private commitWindow(window: ITimeRange) {
    if (!window || window.ty) {
      return;
    }
    const oldAction = this.metricsConfig.metricsAction;
    this.metricsConfig.metricsAction = new FetchApplicationMetricsAction(
      oldAction.guid,
      oldAction.cfGuid,
      new MetricQueryConfig(this.metricsConfig.metricsAction.query.metric, {
        window: window.value
      })
    );
    this.commit = this.getCommitFn(this.metricsConfig.metricsAction);
    this.commit();
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

  private postFetchMiddleware(metricsArray: ChartSeries[]) {
    if (this.metricsConfig.sort) {
      const newMetricsArray = [
        ...metricsArray
      ];
      newMetricsArray.sort(this.metricsConfig.sort);
      if (
        this.metricsConfig.metricsAction.query.params &&
        this.metricsConfig.metricsAction.query.params.start &&
        this.metricsConfig.metricsAction.query.params.end
      ) {
        return MetricsChartManager.fillOutTimeOrderedChartSeries(
          newMetricsArray,
          this.metricsConfig.metricsAction.query.params.start as number,
          this.metricsConfig.metricsAction.query.params.end as number,
          this.metricsConfig.metricsAction.query.params.step as number,
          this.metricsConfig,
        );
      }
    }
    return metricsArray;
  }

  ngOnInit() {
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );


    this.results$ = this.metricsMonitor.entity$.pipe(
      delay(1),
      map(metrics => {
        if (metrics) {
          if (metrics.queryType === MetricQueryType.RANGE_QUERY) {
            const start = moment.unix(parseInt(metrics.query.params.start as string, 10));
            const end = moment.unix(parseInt(metrics.query.params.end as string, 10));
            const isDifferent = !start.isSame(this.start) || !end.isSame(this.end);
            if (isDifferent) {
              this.start = start;
              this.end = end;
            }
            this.selectedTimeRange = this.times.find(time => time.type === RangeType.START_END);
          } else {
            const newWindow = metrics.query.params.window ?
              this.times.find(time => time.value === metrics.query.params.window) :
              this.times[0];
            if (this.selectedTimeRange !== newWindow) {
              this.selectedTimeRange = newWindow;
            }
          }

          const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig);
          if (!metricsArray.length) {
            return null;
          }
          return this.postFetchMiddleware(metricsArray);
        } else {
          this.selectedTimeRange = this.times[0];
          return null;
        }
      })
    );
  }

  private setup(action: MetricsAction) {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }

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
    if (metrics.data) {
      switch (metrics.data.resultType) {
        case MetricResultTypes.MATRIX:
          return MetricsChartManager.mapMatrix(metrics.data, metricsConfig);
        case MetricResultTypes.VECTOR:
          return MetricsChartManager.mapVector(metrics.data, metricsConfig);
        case MetricResultTypes.SCALAR:
        case MetricResultTypes.STRING:
        default:
          throw new Error(`Could not find chart data mapper for metrics type ${metrics.data.resultType}`);
      }
    } else {
      return [];
    }
  }

  private getCommitFn(action: MetricsAction) {
    return () => {
      this.setup(action);
      this.store.dispatch(action);
    };
  }
}
