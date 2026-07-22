import { ApplicationRef, Injectable, NgZone, inject } from '@angular/core';
import { MetricsRequest, MetricQueryType } from '@stratosui/store';
import { Subject } from 'rxjs';
import { isValid, isEqual } from 'date-fns';

import { MetricsRangeSelectorService } from './metrics-range-selector.service';
import { ITimeRange } from './metrics-range-selector.types';

@Injectable({
  providedIn: 'root'
})
export class MetricsRangeSelectorManagerService {
  metricRangeService = inject(MetricsRangeSelectorService);
  private ngZone = inject(NgZone);
  private appRef = inject(ApplicationRef);


  public timeWindow$ = new Subject<ITimeRange>();

  // null until a valid start/end range has been chosen; reset to null after
  // each commit. Templates guard the Set button on `!commit`.
  public commit: (() => void) | null = null;

  public dateValid = false;

  // Slots are independently nullable: a range can be partially entered.
  public committedStartEnd: [Date | null, Date | null] = [null, null];

  public rangeTypes = MetricQueryType;

  public times = this.metricRangeService.times;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  public startEnd: [Date | null, Date | null] = [null, null];

  // Assigned by `init()` / the selectedTimeRange setter before any read.
  public selectedTimeRangeValue!: ITimeRange; // strict: lifecycle-assigned in init() before use

  public request$ = new Subject<MetricsRequest>();

  // Assigned by `init()` before any commit path reads it.
  private baseRequest!: MetricsRequest; // strict: lifecycle-assigned in init() before use

  // setInterval handle, assigned in startWindowPoll; only read by clearInterval.
  private pollIndex!: number; // strict: assigned before clearInterval reads it

  public pollInterval = 10000;

  private commitDate(date: Date | null, type: 'start' | 'end') {
    const index = type === 'start' ? this.startIndex : this.endIndex;
    const oldDate = this.startEnd[index];
    if (oldDate && !date) {
      this.startEnd[index] = date;
      return;
    }
    if (!date || !isValid(date) || (oldDate && isEqual(date, oldDate))) {
      return;
    }
    this.startEnd[index] = date;
    const [start, end] = this.startEnd;
    if (start && end) {
      const next = this.metricRangeService.getNewDateRangeRequest(this.baseRequest, start, end);
      this.commit = () => {
        this.committedStartEnd = [
          this.startEnd[0],
          this.startEnd[1]
        ];
        this.commitRequest(next);
      };
    }
  }

  public init(baseRequest: MetricsRequest) {
    this.baseRequest = baseRequest;
    if (!this.selectedTimeRange) {
      const { timeRange } = this.metricRangeService.resolveTimeRange(baseRequest.windowValue);
      this.selectedTimeRange = timeRange;
    }
  }

  public destroy() {
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

  set start(start: Date | null) {
    this.commitDate(start, 'start');
  }

  get start() {
    return this.startEnd[this.startIndex];
  }

  set end(end: Date | null) {
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
          if (timeWindow.value != null && this.baseRequest) {
            this.commitRequest(this.metricRangeService.getNewTimeWindowRequest(this.baseRequest, timeWindow.value));
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
    // Only reached for ranges with a window value (the selectedTimeRange
    // setter guards on `value` before calling); a value-less custom range
    // commits dates instead. Bail if there is no window to commit.
    if (!timeWindow || !timeWindow.value) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    this.commitRequest(this.metricRangeService.getNewTimeWindowRequest(this.baseRequest, timeWindow.value));
    this.startWindowPoll(timeWindow);
  }

  private commitRequest(request: MetricsRequest) {
    this.request$.next(request);
    this.commit = null;
  }

}
