import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { MetricsAction, MetricQueryType, EntityMonitor, type IMetrics } from '@stratosui/store';
import { Subject, type Subscription } from 'rxjs';
import { debounceTime, takeWhile, tap } from 'rxjs/operators';
import { isValid, isEqual } from 'date-fns';

import { MetricsRangeSelectorService } from './metrics-range-selector.service';
import type { ITimeRange } from './metrics-range-selector.types';

@Injectable({
  providedIn: 'root'
})
export class MetricsRangeSelectorManagerService {

  public timeWindow$ = new Subject<ITimeRange>();

  public commit: () => void = null;

  public dateValid = false;

  public committedStartEnd: [Date, Date] = [null, null];

  public rangeTypes = MetricQueryType;

  public times = this.metricRangeService.times;

  public metricsMonitor: EntityMonitor<IMetrics>;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  public startEnd: [Date, Date] = [null, null];

  private initSub: Subscription;

  public selectedTimeRangeValue: ITimeRange;

  public metricsAction$ = new Subject<MetricsAction>();

  private baseAction: MetricsAction;

  private pollIndex: number;

  public pollInterval = 10000;

  constructor(
    public metricRangeService: MetricsRangeSelectorService,
    private ngZone: NgZone,
    private appRef: ApplicationRef
    ) { }

  private commitDate(date: Date, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (oldDate && !date) {
      this.startEnd[index] = date;
      return;
    }
    if (!date || !isValid(date) || isEqual(date, oldDate)) {
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
    const isDifferent = (!start || !end) || !isEqual(start, this.start) || !isEqual(end, this.end);
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

  set start(start: Date) {
    this.commitDate(start, 'start');
  }

  get start() {
    return this.startEnd[this.startIndex];
  }

  set end(end: Date) {
    this.commitDate(end, 'end');
  }

  get end() {
    return this.startEnd[this.endIndex];
  }

  private startWindowPoll(timeWindow: ITimeRange) {
    this.endWindowPoll();
    this.ngZone.runOutsideAngular(() => {
      this.pollIndex = window.setInterval(
        () => {
          if (timeWindow.value != null && this.baseAction) {
            this.commitAction(this.metricRangeService.getNewTimeWindowAction(this.baseAction, timeWindow.value));
            // ZONELESS: Trigger change detection after periodic metrics update
            // This runs outside Angular zone but needs to notify Angular of state changes
            this.ngZone.run(() => this.appRef.tick());
          }
        },
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
