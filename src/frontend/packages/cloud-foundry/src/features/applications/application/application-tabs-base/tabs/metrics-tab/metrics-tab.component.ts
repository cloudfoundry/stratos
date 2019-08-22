import { Component } from '@angular/core';

import { MetricsConfig } from '../../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import {
  MetricsLineChartConfig,
} from '../../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  ChartDataTypes,
  getMetricsChartConfigBuilder,
} from '../../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { MetricQueryConfig } from '../../../../../../../../store/src/actions/metrics.actions';
import { IMetricMatrixResult } from '../../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../../../store/src/types/metric.types';
import { FetchApplicationChartMetricsAction } from '../../../../../../actions/cf-metrics.actions';
import { ApplicationService } from '../../../../application.service';

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
