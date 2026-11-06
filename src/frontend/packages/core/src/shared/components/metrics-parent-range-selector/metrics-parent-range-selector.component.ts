
import { ChangeDetectionStrategy, AfterContentInit, Component, ContentChildren, OnDestroy, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardWrapperComponent } from '../cards/card/card.component';
import { CustomFormFieldComponent } from '../custom-form-field/custom-form-field.component';
import { CustomSelectComponent, CustomOptionComponent } from '../custom-select/custom-select.component';
import { MetricQueryType } from '@stratosui/store';
import { Subscription } from 'rxjs';

import { MetricsRangeSelectorManagerService } from '../../services/metrics-range-selector-manager.service';
import { MetricsChartComponent } from '../metrics-chart/metrics-chart.component';
import { StartEndDateComponent } from '../start-end-date/start-end-date.component';

@Component({
  selector: 'app-metrics-parent-range-selector',
  templateUrl: './metrics-parent-range-selector.component.html',
  styleUrls: ['./metrics-parent-range-selector.component.scss'],
  providers: [
    MetricsRangeSelectorManagerService
  ],
  standalone: true,
  imports: [
    CommonModule,
    CardWrapperComponent,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    StartEndDateComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsParentRangeSelectorComponent implements AfterContentInit, OnDestroy {
  rangeSelectorManager = inject(MetricsRangeSelectorManagerService);

  private requestSub!: Subscription;

  @ContentChildren(MetricsChartComponent)
  private metricsCharts!: QueryList<MetricsChartComponent>;

  public rangeTypes = MetricQueryType;

  ngAfterContentInit() {
    if (!this.metricsCharts || !this.metricsCharts.first) {
      return;
    }
    const baseRequest = this.metricsCharts.first.metricsConfig.request;
    this.rangeSelectorManager.init(baseRequest);
    this.requestSub = this.rangeSelectorManager.request$.subscribe(next => {
      if (next) {
        this.metricsCharts.forEach(chart => {
          const oldRequest = chart.currentRequest;
          chart.applyRequest({
            ...oldRequest,
            queryType: next.queryType,
            query: {
              ...oldRequest.query,
              params: next.query.params,
            },
            windowValue: next.windowValue,
          });
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.requestSub) {
      this.requestSub.unsubscribe();
    }
  }

}
