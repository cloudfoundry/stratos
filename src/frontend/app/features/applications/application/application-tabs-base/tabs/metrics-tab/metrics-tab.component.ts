import { Component } from '@angular/core';
import { ApplicationService } from '../../../../application.service';
import { MetricsConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../../../store/types/metric.types';
import { MetricsChartHelpers } from '../../../../../../shared/components/metrics-chart/metrics.component.helpers';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../../../../store/actions/metrics.actions';
import { MetricsLineChartConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.types';

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
  private buildChartConfig(yLabel: string) {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = yLabel;
    return lineChartConfig;
  }
  constructor(public applicationService: ApplicationService) {

    this.instanceMetricConfigs = [
      [
        {
          getSeriesName: result => `Instance ${result.metric.instance_index}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          metricsAction: new FetchApplicationMetricsAction(
            applicationService.appGuid,
            applicationService.cfGuid,
            new MetricQueryConfig('firehose_container_metric_cpu_percentage')
          )
        },
        this.buildChartConfig('CPU Usage (%)')
      ],
      [
        {
          getSeriesName: result => `Instance ${result.metric.instance_index}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          mapSeriesItemValue: (bytes) => (bytes / 1000000).toFixed(2),
          metricsAction: new FetchApplicationMetricsAction(
            applicationService.appGuid,
            applicationService.cfGuid,
            new MetricQueryConfig('firehose_container_metric_memory_bytes')
          )
        },
        this.buildChartConfig('Memory Usage (MB)')
      ],
      [
        {
          getSeriesName: result => `Instance ${result.metric.instance_index}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          mapSeriesItemValue: (bytes) => (bytes / 1000000).toFixed(2),
          metricsAction: new FetchApplicationMetricsAction(
            applicationService.appGuid,
            applicationService.cfGuid,
            new MetricQueryConfig('firehose_container_metric_disk_bytes')
          )
        },
        this.buildChartConfig('Disk Usage (MB)')
      ]
    ];

  }
}
