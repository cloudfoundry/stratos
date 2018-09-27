import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { debounceTime, takeWhile, tap } from 'rxjs/operators';
import { FetchApplicationMetricsAction, MetricsAction } from '../../../store/actions/metrics.actions';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { IMetrics } from '../../../store/types/base-metric.types';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { MetricsRangeSelectorService } from '../../services/metrics-range-selector.service';
import { ITimeRange, MetricQueryType } from '../../services/metrics-range-selector.types';
import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';

@Component({
  selector: 'app-metrics-range-selector',
  templateUrl: './metrics-range-selector.component.html',
  styleUrls: ['./metrics-range-selector.component.scss'],
  providers: [
    MetricsRangeSelectorManagerService
  ]
})
export class MetricsRangeSelectorComponent implements OnDestroy {

  constructor(
    private entityMonitorFactory: EntityMonitorFactory,
    private metricRangeService: MetricsRangeSelectorService,
    public rangeSelectorManager: MetricsRangeSelectorManagerService
  ) { }

  public metricsMonitor: EntityMonitor<IMetrics>;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  private startEnd: [moment.Moment, moment.Moment] = [null, null];

  private initSub: Subscription;

  @Output()
  public metricsAction = new EventEmitter<FetchApplicationMetricsAction>();

  private baseActionValue: MetricsAction;

  @Input()
  set baseAction(action: MetricsAction) {
    this.baseActionValue = action;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      action.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );
    // this.rangeSelectorManager.init(this.metricsMonitor);
    this.initSub = this.getInitSub(this.metricsMonitor);
  }

  get baseAction() {
    return this.baseActionValue;
  }

  public commit: Function = null;

  public dateValid = false;

  public committedStartEnd: [moment.Moment, moment.Moment] = [null, null];

  public rangeTypes = MetricQueryType;

  public times = this.metricRangeService.times;

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

  get selectedTimeRange() {
    return this.selectedTimeRangeValue;
  }

  set selectedTimeRange(timeRange: ITimeRange) {
    this.commit = null;
    this.selectedTimeRangeValue = timeRange;
    if (this.selectedTimeRangeValue.queryType === MetricQueryType.QUERY) {
      this.commitWindow(this.selectedTimeRangeValue);
    } else if (this.selectedTimeRangeValue.queryType === MetricQueryType.RANGE_QUERY) {
      if (!this.startEnd[0] || !this.startEnd[1]) {
        this.showOverlay = true;
      }
    }
  }

  private getInitSub(entityMonitor: EntityMonitor<IMetrics>) {
    return entityMonitor.entity$.pipe(
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

  private commitWindow(window: ITimeRange) {
    if (!window) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    this.commitAction(this.metricRangeService.getNewTimeWindowAction(this.baseAction, window));
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

  private commitAction(action: MetricsAction) {
    this.metricsAction.emit(action);
    this.commit = null;
  }

  ngOnDestroy() {
    this.rangeSelectorManager.destroy();
  }

}
