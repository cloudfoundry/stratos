import { Component } from '@angular/core';
import { MetricsConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.types';
import { IMetricMatrixResult } from '../../../../../../../../cloud-foundry/src/store/types/base-metric.types';
import { IMetricApplication } from '../../../../../../../../cloud-foundry/src/store/types/metric.types';
import { MetricQueryConfig, FetchApplicationChartMetricsAction } from '../../../../../../../../store/src/actions/metrics.actions';
import { ApplicationService } from '../../../../application.service';
import { getMetricsChartConfigBuilder, ChartDataTypes } from '../../../../../../shared/components/metrics-chart/metrics.component.helpers';

@Component({
  selector: 'app-metrics-tab',
  templateUrl: './metrics-tab.component.html',
  styleUrls: ['./metrics-tab.component.scss']
})
export class MetricsTabComponent {
  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];
  constructor(public applicationService: ApplicationService) {
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(result => `Instance ${result.metric.instance_index}`);
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          applicationService.appGuid,
          applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_cpu_percentage')
        ),
        'CPU Usage (%)',
        ChartDataTypes.CPU_PERCENT
      ),
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          applicationService.appGuid,
          applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_memory_bytes')
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        new FetchApplicationChartMetricsAction(
          applicationService.appGuid,
          applicationService.cfGuid,
          new MetricQueryConfig('firehose_container_metric_disk_bytes')
        ),
        'Disk Usage (MB)',
        ChartDataTypes.BYTES
      )
    ];

  }
}
