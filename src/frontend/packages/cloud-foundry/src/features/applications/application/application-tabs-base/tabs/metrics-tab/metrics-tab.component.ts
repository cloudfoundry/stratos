import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  MetricsChartComponent,
  MetricsParentRangeSelectorComponent,
  MetricsConfig,
  MetricsLineChartConfig,
  ChartDataTypes,
  getMetricsChartConfigBuilder
} from '@stratosui/core';
import { MetricQueryConfig, IMetricMatrixResult, IMetricApplication } from '@stratosui/store';
import { FetchApplicationChartMetricsAction } from '../../../../../../actions/cf-metrics.actions';
import { ApplicationService } from '../../../../application.service';

@Component({
  selector: 'app-metrics-tab',
  templateUrl: './metrics-tab.component.html',
  styleUrls: ['./metrics-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MetricsChartComponent,
    MetricsParentRangeSelectorComponent
]
})
export class MetricsTabComponent {
  public applicationService = inject(ApplicationService);

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];

  constructor() {
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(result => `Instance ${result.metric.instance_index}`);
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          this.applicationService.appGuid,
          this.applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_cpu_percentage')
        ),
        'CPU Usage (%)',
        ChartDataTypes.CPU_PERCENT
      ),
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          this.applicationService.appGuid,
          this.applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_memory_bytes')
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          this.applicationService.appGuid,
          this.applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_disk_bytes')
        ),
        'Disk Usage (MB)',
        ChartDataTypes.BYTES
      )
    ];

  }
}
