import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { debounceTime, map, takeWhile, tap } from 'rxjs/operators';
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
  private committedAction: MetricsAction;
  @Input()
  public metricsConfig: MetricsConfig;
  @Input()
  public chartConfig: MetricsChartConfig;
  @Input()
  public title: string;

  @ViewChild('noDatesSelected')
  public noDatesSelected: ElementRef;

  public chartTypes = MetricsChartTypes;

  private startEnd: [moment.Moment, moment.Moment] = [null, null];

  public committedStartEnd: [moment.Moment, moment.Moment] = [null, null];

  private pollSub: Subscription;

  private initSub: Subscription;

  public commit: Function = null;

  public results$;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  public metricsMonitor: EntityMonitor<IMetrics>;

  public rangeTypes = RangeType;

  public dateValid = false;

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
      label: 'Set time window',
      type: RangeType.START_END
    }
  ];

  public selectedTimeRangeValue: ITimeRange;

  set showOverlay(show: boolean) {
    this.showOverlayValue = show;
  }

  get showOverlay() {
    return this.showOverlayValue;
  }

  public showOverlayValue = false;

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
      const action = new FetchApplicationMetricsAction(
        oldAction.guid,
        oldAction.cfGuid,
        new MetricQueryConfig(this.metricsConfig.metricsAction.query.metric, {
          start: startUnix,
          end: end.unix(),
          step: Math.max((endUnix - startUnix) / 200, 0)
        }),
        MetricQueryType.RANGE_QUERY
      );

      this.commit = () => {
        this.committedStartEnd = [
          this.startEnd[0],
          this.startEnd[1]
        ];
        this.commitAction(action);
      };
    }
  }

  get selectedTimeRange() {
    return this.selectedTimeRangeValue;
  }

  set selectedTimeRange(timeRange: ITimeRange) {
    this.commit = null;
    this.selectedTimeRangeValue = timeRange;
    if (this.selectedTimeRangeValue.type === RangeType.ROLLING_WINDOW) {
      this.commitWindow(this.selectedTimeRangeValue);
    } else if (this.selectedTimeRangeValue.type === RangeType.START_END) {
      if (!this.startEnd[0] || !this.startEnd[1]) {
        this.showOverlay = true;
      }
    }
  }

  private commitWindow(window: ITimeRange) {
    if (!window) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    const oldAction = this.metricsConfig.metricsAction;
    const action = new FetchApplicationMetricsAction(
      oldAction.guid,
      oldAction.cfGuid,
      new MetricQueryConfig(this.metricsConfig.metricsAction.query.metric, {
        window: window.value
      })
    );
    this.commitAction(action);
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
        this.committedAction.query.params &&
        this.committedAction.query.params.start &&
        this.committedAction.query.params.end
      ) {
        return MetricsChartManager.fillOutTimeOrderedChartSeries(
          newMetricsArray,
          this.committedAction.query.params.start as number,
          this.committedAction.query.params.end as number,
          this.committedAction.query.params.step as number,
          this.metricsConfig,
        );
      }
    }
    return metricsArray;
  }

  private getInitSub(entityMonitor: EntityMonitor<IMetrics>) {
    return entityMonitor.entity$.pipe(
      debounceTime(1),
      tap(metrics => {
        if (!this.selectedTimeRange) {
          if (metrics) {
            if (metrics.queryType === MetricQueryType.RANGE_QUERY) {
              const start = moment.unix(parseInt(metrics.query.params.start as string, 10));
              const end = moment.unix(parseInt(metrics.query.params.end as string, 10));
              const isDifferent = !start.isSame(this.start) || !end.isSame(this.end);
              if (isDifferent) {
                this.start = start;
                this.end = end;
                this.committedStartEnd = [start, end];
              }
              this.selectedTimeRange = this.times.find(time => time.type === RangeType.START_END);
            } else {
              const newWindow = metrics.query.params.window ?
                this.times.find(time => time.value === metrics.query.params.window) :
                this.getDefaultTimeRange();
              if (this.selectedTimeRange !== newWindow) {
                this.selectedTimeRange = newWindow;
              }
            }
          } else {
            this.selectedTimeRange = this.getDefaultTimeRange();
          }
        }
      }),
      takeWhile(metrics => !metrics)
    ).subscribe();
  }

  private getDefaultTimeRange() {
    return this.times.find(time => time.value === '1h') || this.times[0];
  }

  ngOnInit() {
    this.committedAction = this.metricsConfig.metricsAction;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.metricsConfig.metricsAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );

    this.initSub = this.getInitSub(this.metricsMonitor);

    this.results$ = this.metricsMonitor.entity$.pipe(
      map(metrics => {
        const metricsArray = this.mapMetricsToChartData(metrics, this.metricsConfig);
        if (!metricsArray.length) {
          return null;
        }
        return this.postFetchMiddleware(metricsArray);
      })
    );
  }

  private setup(action: MetricsAction) {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
    if (action.queryType === MetricQueryType.QUERY) {
      this.pollSub = this.metricsMonitor
        .poll(
          10000,
          () => {
            this.store.dispatch(action);
          },
          request => ({ busy: request.fetching, error: request.error, message: request.message })
        ).subscribe();
    }
  }

  ngOnDestroy() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
    }
    if (this.initSub) {
      this.initSub.unsubscribe();
    }
  }

  private mapMetricsToChartData(metrics: IMetrics, metricsConfig: MetricsConfig) {
    if (metrics && metrics.data) {
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

  private commitAction(action: MetricsAction) {
    this.committedAction = action;
    this.setup(action);
    this.store.dispatch(action);
    this.commit = null;
  }
}
