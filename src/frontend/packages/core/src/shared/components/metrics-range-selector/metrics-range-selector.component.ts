import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
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
  }

  public rangeTypes = MetricQueryType;

  @Output()
  public request = new EventEmitter<MetricsRequest>();

  private baseRequestValue!: MetricsRequest;

  @Input()
  set baseRequest(req: MetricsRequest) {
    this.baseRequestValue = req;
    this.rangeSelectorManager.init(req);
  }
  get baseRequest() {
    return this.baseRequestValue;
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
  public validate?: (start: Date, end: Date) => string;

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
