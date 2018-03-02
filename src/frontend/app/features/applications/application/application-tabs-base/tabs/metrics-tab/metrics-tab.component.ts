import { Component, OnInit } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../../../store/types/base-metric.types';
import { FetchApplicationMetricsAction } from '../../../../../../store/actions/metrics.actions';
import { ApplicationService } from '../../../../application.service';

@Component({
  selector: 'app-metrics-tab',
  templateUrl: './metrics-tab.component.html',
  styleUrls: ['./metrics-tab.component.scss']
})
export class MetricsTabComponent {
  constructor(public applicationService: ApplicationService) { }
}
