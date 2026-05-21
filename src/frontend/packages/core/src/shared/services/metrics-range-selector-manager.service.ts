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

  public commit: () => void = null;

  public dateValid = false;

  public committedStartEnd: [Date, Date] = [null, null];

  public rangeTypes = MetricQueryType;

  public times = this.metricRangeService.times;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  public startEnd: [Date, Date] = [null, null];

  public selectedTimeRangeValue: ITimeRange;

  public request$ = new Subject<MetricsRequest>();

  private baseRequest: MetricsRequest;

  private pollIndex: number;

  public pollInterval = 10000;

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
    if (!timeWindow) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    this.commitRequest(this.metricRangeService.getNewTimeWindowRequest(this.baseRequest, timeWindow.value));
    if (timeWindow.value) {
      this.startWindowPoll(timeWindow);
    }
  }

  private commitRequest(request: MetricsRequest) {
    this.request$.next(request);
    this.commit = null;
  }

}
