import { MetricsRangeSelectorService } from './metrics-range-selector.service';
import { MetricsAction } from './../../store/actions/metrics.actions';
import { Injectable, EventEmitter } from '@angular/core';

import * as moment from 'moment';
import { MetricQueryType, ITimeRange } from './metrics-range-selector.types';
import { EntityMonitor } from '../monitors/entity-monitor';
import { IMetrics } from '../../store/types/base-metric.types';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, tap, takeWhile } from 'rxjs/operators';

@Injectable()
export class MetricsRangeSelectorManagerService {

  public timeWindow$ = new Subject<ITimeRange>();

  public commit: Function = null;

  public dateValid = false;

  public committedStartEnd: [moment.Moment, moment.Moment] = [null, null];

  public rangeTypes = MetricQueryType;

  public times = this.metricRangeService.times;

  public metricsMonitor: EntityMonitor<IMetrics>;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  public startEnd: [moment.Moment, moment.Moment] = [null, null];

  private initSub: Subscription;

  public selectedTimeRangeValue: ITimeRange;

  public metricsAction$ = new Subject<MetricsAction>();

  private baseAction: MetricsAction;

  constructor(public metricRangeService: MetricsRangeSelectorService) { }

  private commitDate(date: moment.Moment, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (!date.isValid() || date.isSame(oldDate)) {
      return;
    }
    this.startEnd[index] = date;
    const [start, end] = this.startEnd;
    if (start && end) {
      const action = this.metricRangeService.getNewDateRangeAction(this.baseAction, start, end);
      this.commit = () => {
        this.committedStartEnd = [
          this.startEnd[0],
          this.startEnd[1]
        ];
        this.commitAction(action);
      };
    }
  }

  public init(entityMonitor: EntityMonitor<IMetrics>, baseAction: MetricsAction) {
    this.baseAction = baseAction;
    this.initSub = entityMonitor.entity$.pipe(
      debounceTime(1),
      tap(metrics => {
        if (!this.selectedTimeRange) {
          const { timeRange, start, end } = this.metricRangeService.getDateFromStoreMetric(metrics);

          if (timeRange.queryType === MetricQueryType.RANGE_QUERY) {
            const isDifferent = !start.isSame(this.start) || !end.isSame(this.end);
            if (isDifferent) {
              this.start = start;
              this.end = end;
              this.committedStartEnd = [start, end];
            }
          }
          this.selectedTimeRange = timeRange;
        }
      }),
      takeWhile(metrics => !metrics)
    ).subscribe();
  }

  public destroy() {
    if (this.initSub) {
      this.initSub.unsubscribe();
    }
  }

  get selectedTimeRange() {
    return this.selectedTimeRangeValue;
  }

  set selectedTimeRange(timeRange: ITimeRange) {
    this.commit = null;
    this.start = null;
    this.end = null;
    this.selectedTimeRangeValue = timeRange;
    this.timeWindow$.next(this.selectedTimeRangeValue);
    if (this.selectedTimeRangeValue.queryType === MetricQueryType.QUERY) {
      this.commitWindow(this.selectedTimeRangeValue);
    }
  }

  set start(start: moment.Moment) {
    if (start) {
      this.commitDate(start, 'start');
    }
  }

  get start() {
    return this.startEnd[this.startIndex];
  }

  set end(end: moment.Moment) {
    if (end) {
      this.commitDate(end, 'end');
    }
  }

  get end() {
    return this.startEnd[this.endIndex];
  }

  private commitWindow(window: ITimeRange) {
    if (!window) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    this.commitAction(this.metricRangeService.getNewTimeWindowAction(this.baseAction, window));
  }

  private commitAction(action: MetricsAction) {
    this.metricsAction$.next(action);
    this.commit = null;
  }

}
