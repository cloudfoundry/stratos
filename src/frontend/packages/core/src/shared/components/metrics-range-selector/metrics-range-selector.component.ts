import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

import { MetricsAction } from '../../../../../store/src/actions/metrics.actions';
import { EntityMonitor } from '../../../../../store/src/monitors/entity-monitor';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { IMetrics } from '../../../../../store/src/types/base-metric.types';
import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { ITimeRange, MetricQueryType } from '../../services/metrics-range-selector.types';

@Component({
  selector: 'app-metrics-range-selector',
  templateUrl: './metrics-range-selector.component.html',
  styleUrls: ['./metrics-range-selector.component.scss'],
  providers: [
    MetricsRangeSelectorManagerService
  ]
})
export class MetricsRangeSelectorComponent implements OnDestroy {
  private rangeSelectorSub: Subscription;
  actionSub: Subscription;

  constructor(
    private entityMonitorFactory: EntityMonitorFactory,
    public rangeSelectorManager: MetricsRangeSelectorManagerService
  ) {
    this.rangeSelectorSub = this.rangeSelectorManager.timeWindow$.subscribe(selectedTimeRangeValue => {
      if (selectedTimeRangeValue.queryType === MetricQueryType.RANGE_QUERY) {
        if (!this.rangeSelectorManager.committedStartEnd[0] || !this.rangeSelectorManager.committedStartEnd[1]) {
          this.showOverlay = true;
        }
      }
    });
    this.actionSub = this.rangeSelectorManager.metricsAction$.subscribe(newAction => {
      if (newAction) {
        this.commitAction(newAction);
      }
    });
  }

  public metricsMonitor: EntityMonitor<IMetrics>;

  public rangeTypes = MetricQueryType;


  @Output()
  public metricsAction = new EventEmitter<MetricsAction>();

  private baseActionValue: MetricsAction;

  @Input()
  set baseAction(action: MetricsAction) {
    this.baseActionValue = action;
    this.metricsMonitor = this.entityMonitorFactory.create<IMetrics>(
      action.guid,
      // Look specifically for metrics entity type for the given endpoint. See #3783
      {
        entityType: action.entityType,
        endpointType: action.endpointType
      }
    );
    this.rangeSelectorManager.init(this.metricsMonitor, action);
  }
  get baseAction() {
    return this.baseActionValue;
  }

  @Input()
  set times(customTimes: ITimeRange[]) {
    if (customTimes && customTimes.length > 0) {
      this.rangeSelectorManager.times = customTimes;
      this.rangeSelectorManager.metricRangeService.times = customTimes;
    }
  }

  @Input()
  set selectedTimeValue(timeValue: string) {
    this.rangeSelectorManager.metricRangeService.defaultTimeValue = timeValue;
  }

  @Input()
  set pollInterval(interval: number) {
    if (interval) {
      this.rangeSelectorManager.pollInterval = interval;
    }
  }

  @Input()
  public validate: (start: moment.Moment, end: moment.Moment) => string;

  set showOverlay(show: boolean) {
    this.showOverlayValue = show;
  }

  get showOverlay() {
    return this.showOverlayValue;
  }

  public showOverlayValue = false;

  private commitAction(action: MetricsAction) {
    this.metricsAction.emit(action);
  }

  private tidyUp() {
    this.rangeSelectorManager.destroy();
    if (this.rangeSelectorSub) {
      this.rangeSelectorSub.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.tidyUp();
  }

}
