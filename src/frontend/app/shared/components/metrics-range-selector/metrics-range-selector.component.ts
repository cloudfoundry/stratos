import { Component, OnInit, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import * as moment from 'moment';
import { FetchApplicationMetricsAction, MetricQueryConfig, MetricsAction, MetricQueryType } from '../../../store/actions/metrics.actions';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { IMetrics } from '../../../store/types/base-metric.types';
import { debounceTime, tap, takeWhile } from 'rxjs/operators';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { metricSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { Subscription } from 'rxjs';

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
  selector: 'app-metrics-range-selector',
  templateUrl: './metrics-range-selector.component.html',
  styleUrls: ['./metrics-range-selector.component.scss']
})
export class MetricsRangeSelectorComponent implements OnInit, OnDestroy {

  private committedAction: MetricsAction;

  public metricsMonitor: EntityMonitor<IMetrics>;

  private readonly startIndex = 0;

  private readonly endIndex = 1;

  private startEnd: [moment.Moment, moment.Moment] = [null, null];

  private initSub: Subscription;

  @Output()
  public metricsAction = new EventEmitter<FetchApplicationMetricsAction>();

  @Input()
  public baseAction: MetricsAction;

  public commit: Function = null;

  public dateValid = false;

  public committedStartEnd: [moment.Moment, moment.Moment] = [null, null];

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
      const oldAction = this.baseAction;
      const action = new FetchApplicationMetricsAction(
        oldAction.guid,
        oldAction.cfGuid,
        new MetricQueryConfig(this.baseAction.query.metric, {
          start: startUnix,
          end: end.unix(),
          step: Math.max((endUnix - startUnix) / 200, 0)
        }),
        MetricQueryType.RANGE_QUERY
      );

      this.commit = () => {
        console.log('commiting');
        this.committedStartEnd = [
          this.startEnd[0],
          this.startEnd[1]
        ];
        this.metricsAction.emit(action);
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

  private commitWindow(window: ITimeRange) {
    if (!window) {
      return;
    }
    this.committedStartEnd = [null, null];
    this.startEnd = [null, null];
    const oldAction = this.baseAction;
    const action = new FetchApplicationMetricsAction(
      oldAction.guid,
      oldAction.cfGuid,
      new MetricQueryConfig(this.baseAction.query.metric, {
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

  private getDefaultTimeRange() {
    return this.times.find(time => time.value === '1h') || this.times[0];
  }

  private commitAction(action: MetricsAction) {
    this.committedAction = action;
    this.commit = null;
  }

  constructor(private entityMonitorFactory: EntityMonitorFactory) { }

  ngOnInit() {

    this.committedAction = this.baseAction;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      this.baseAction.metricId,
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );

    this.initSub = this.getInitSub(this.metricsMonitor);
  }

  ngOnDestroy() {
    if (this.initSub) {
      this.initSub.unsubscribe();
    }
  }

}
