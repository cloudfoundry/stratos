import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import {
  MetricsChartComponent,
  MetricsParentRangeSelectorComponent,
  MetricsConfig,
  MetricsLineChartConfig,
  ChartDataTypes,
  getMetricsChartConfigBuilder
} from '@stratosui/core';
import { MetricQueryConfig, MetricQueryType, MetricsRequest, IMetricMatrixResult, IMetricApplication } from '@stratosui/store';
import { ApplicationService } from '../../../../application.service';

const APP_METRICS_BASE_URL = '/pp/v1/metrics';

function buildAppMetricRequest(appGuid: string, cfGuid: string, metric: string): MetricsRequest {
  return {
    endpointGuid: cfGuid,
    url: `${APP_METRICS_BASE_URL}/cf/app/${appGuid}`,
    query: new MetricQueryConfig(metric),
    queryType: MetricQueryType.RANGE_QUERY,
    windowValue: null,
  };
}

@Component({
  selector: 'app-metrics-tab',
  templateUrl: './metrics-tab.component.html',
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
    const appGuid = this.applicationService.appGuid;
    const cfGuid = this.applicationService.cfGuid;
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(result => `Instance ${result.metric.instance_index}`);
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        buildAppMetricRequest(appGuid, cfGuid, 'firehose_container_metric_cpu_percentage'),
        'CPU Usage (%)',
        ChartDataTypes.CPU_PERCENT
      ),
      chartConfigBuilder(
        buildAppMetricRequest(appGuid, cfGuid, 'firehose_container_metric_memory_bytes'),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        buildAppMetricRequest(appGuid, cfGuid, 'firehose_container_metric_disk_bytes'),
        'Disk Usage (MB)',
        ChartDataTypes.BYTES
      )
    ];

  }
}
