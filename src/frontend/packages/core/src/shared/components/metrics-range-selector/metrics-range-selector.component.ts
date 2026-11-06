import { ChangeDetectionStrategy, Component, OnDestroy, effect, inject, input, output, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomFormFieldComponent } from '../custom-form-field/custom-form-field.component';
import { CustomSelectComponent, CustomOptionComponent } from '../custom-select/custom-select.component';
import { MetricQueryType, MetricsRequest } from '@stratosui/store';
import { Subscription } from 'rxjs';

import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { ITimeRange } from '../../services/metrics-range-selector.types';
import { StartEndDateComponent } from '../start-end-date/start-end-date.component';

@Component({
  selector: 'app-metrics-range-selector',
  templateUrl: './metrics-range-selector.component.html',
  styleUrls: ['./metrics-range-selector.component.scss'],
  providers: [
    MetricsRangeSelectorManagerService
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    StartEndDateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsRangeSelectorComponent implements OnDestroy {
  rangeSelectorManager = inject(MetricsRangeSelectorManagerService);

  private rangeSelectorSub: Subscription;
  private requestSub: Subscription;

  constructor() {
    this.rangeSelectorSub = this.rangeSelectorManager.timeWindow$.subscribe(selectedTimeRangeValue => {
      if (selectedTimeRangeValue.queryType === MetricQueryType.RANGE_QUERY) {
        if (!this.rangeSelectorManager.committedStartEnd[0] || !this.rangeSelectorManager.committedStartEnd[1]) {
          this.showOverlay = true;
        }
      }
    });
    this.requestSub = this.rangeSelectorManager.request$.subscribe(next => {
      if (next) {
        this.request.emit(next);
      }
    });
    // Options that change later. The values at the start are applied by
    // start(), ahead of the manager's init.
    effect(() => this.applyOptions());
    effect(() => {
      const req = this.baseRequest();
      if (req) {
        untracked(() => this.start(req));
      }
    });
  }

  public rangeTypes = MetricQueryType;

  public readonly request = output<MetricsRequest>();

  // The request the time windows are applied to, for a host that binds it.
  // The metrics chart has the selector as projected content and calls start()
  // itself once that content is ready.
  readonly baseRequest = input<MetricsRequest>();

  // Starting the manager is what sends the first request, so the options
  // below are applied first.
  start(req: MetricsRequest) {
    this.applyOptions();
    this.rangeSelectorManager.init(req);
  }

  // The time windows on offer; the manager's own list when empty.
  readonly times = input<ITimeRange[]>();

  // The `value` of the time window selected at the start.
  readonly selectedTimeValue = input<string>();

  // Milliseconds between refreshes of a relative time window.
  readonly pollInterval = input<number>();

  private applyOptions() {
    const times = this.times();
    if (times && times.length > 0) {
      this.rangeSelectorManager.times = times;
      this.rangeSelectorManager.metricRangeService.times = times;
    }
    const timeValue = this.selectedTimeValue();
    if (timeValue !== undefined) {
      this.rangeSelectorManager.metricRangeService.defaultTimeValue = timeValue;
    }
    const interval = this.pollInterval();
    if (interval) {
      this.rangeSelectorManager.pollInterval = interval;
    }
  }

  public readonly validate = input<(start: Date | undefined, end: Date | undefined) => string>();

  set showOverlay(show: boolean) {
    this.showOverlayValue = show;
  }

  get showOverlay() {
    return this.showOverlayValue;
  }

  public showOverlayValue = false;

  ngOnDestroy() {
    this.rangeSelectorManager.destroy();
    if (this.rangeSelectorSub) {
      this.rangeSelectorSub.unsubscribe();
    }
    if (this.requestSub) {
      this.requestSub.unsubscribe();
    }
  }

}
