import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { MetricsAction } from '../../../store/actions/metrics.actions';
import { entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { IMetrics } from '../../../store/types/base-metric.types';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { EntityMonitorFactory } from '../../monitors/entity-monitor.factory.service';
import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { MetricQueryType } from '../../services/metrics-range-selector.types';

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
      metricSchemaKey,
      entityFactory(metricSchemaKey)
    );
    this.rangeSelectorManager.init(this.metricsMonitor, action);
  }

  get baseAction() {
    return this.baseActionValue;
  }


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
