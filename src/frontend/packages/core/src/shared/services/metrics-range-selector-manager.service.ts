import { Injectable, NgZone } from '@angular/core';
import * as moment from 'moment';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, takeWhile, tap } from 'rxjs/operators';

import { MetricsAction } from '../../../../store/src/actions/metrics.actions';
import { EntityMonitor } from '../../../../store/src/monitors/entity-monitor';
import { IMetrics } from '../../../../store/src/types/base-metric.types';
import { MetricQueryType } from '../../../../store/src/types/metric.types';
import { MetricsRangeSelectorService } from './metrics-range-selector.service';
import { ITimeRange } from './metrics-range-selector.types';

@Injectable()
export class MetricsRangeSelectorManagerService {

  public timeWindow$ = new Subject<ITimeRange>();

  public commit: () => void = null;

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

  private pollIndex: number;

  public pollInterval = 10000;

  constructor(
    public metricRangeService: MetricsRangeSelectorService,
    private ngZone: NgZone,
    ) { }

  private commitDate(date: moment.Moment, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (oldDate && !date) {
      this.startEnd[index] = date;
      return;
    }
    if (!date || !date.isValid() || date.isSame(oldDate)) {
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

  private setTimeWindowFromStore(metrics: IMetrics) {
    const { timeRange, start, end } = this.metricRangeService.getDateFromStoreMetric(metrics);
    const isDifferent = (!start || !end) || !start.isSame(this.start) || !end.isSame(this.end);
    if (isDifferent) {
      this.committedStartEnd = [start, end];
    }
    this.selectedTimeRange = timeRange;
  }

  public init(entityMonitor: EntityMonitor<IMetrics>, baseAction: MetricsAction) {
    this.baseAction = baseAction;
    this.initSub = entityMonitor.entity$.pipe(
      tap(metrics => {
        if (metrics && !this.selectedTimeRange) {
          this.setTimeWindowFromStore(metrics);
        }
      }),
      debounceTime(0),
      tap(metrics => {
        // entity$ emits null first.
        // If its still null after the debounce then we run setTimeWindowFromStore to get default selection
        if (!metrics && !this.selectedTimeRange) {
          this.setTimeWindowFromStore(metrics);
        }
      }),
      takeWhile(metrics => !metrics)
    ).subscribe();
  }

  public destroy() {
    if (this.initSub) {
      this.initSub.unsubscribe();
    }
    this.endWindowPoll();
  }

  get selectedTimeRange() {
    return this.selectedTimeRangeValue;
  }

  set selectedTimeRange(timeRange: ITimeRange) {
    this.endWindowPoll();
    this.commit = null;
    this.start = null;
    this.end = null;
    this.selectedTimeRangeValue = timeRange;
    this.timeWindow$.next(this.selectedTimeRangeValue);
    if (this.selectedTimeRangeValue.value) {
      this.commitWindow(this.selectedTimeRangeValue);
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

  private startWindowPoll(timeWindow: ITimeRange) {
    this.endWindowPoll();
    this.ngZone.runOutsideAngular(() => {
      this.pollIndex = window.setInterval(
        () => this.commitAction(this.metricRangeService.getNewTimeWindowAction(this.baseAction, timeWindow.value)),
        this.pollInterval
      );
    });
  }

  private endWindowPoll() {
    window.clearInterval(this.pollIndex);
  }

  private commitWindow(timeWindow: ITimeRange) {
    this.endWindowPoll();
    if (!timeWindow) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    this.commitAction(this.metricRangeService.getNewTimeWindowAction(this.baseAction, timeWindow.value));
    if (timeWindow.value) {
      this.startWindowPoll(timeWindow);
    }
  }

  private commitAction(action: MetricsAction) {
    this.metricsAction$.next(action);
    this.commit = null;
  }

}
