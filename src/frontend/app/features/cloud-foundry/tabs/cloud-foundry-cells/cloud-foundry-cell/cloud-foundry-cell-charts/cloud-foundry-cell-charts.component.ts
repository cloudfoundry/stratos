import { Component } from '@angular/core';

import { MetricsConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricQueryType } from '../../../../../../shared/services/metrics-range-selector.types';
import { IMetricMatrixResult } from '../../../../../../store/types/base-metric.types';
import { IMetricCell } from '../../../../../../store/types/metric.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-charts',
  templateUrl: './cloud-foundry-cell-charts.component.html',
  styleUrls: ['./cloud-foundry-cell-charts.component.scss'],
})
export class CloudFoundryCellChartsComponent {

  public metricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricCell>>,
    MetricsLineChartConfig
  ][];

  constructor(public cfCellService: CloudFoundryCellService) {

    this.metricConfigs = [
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_remaining_containers', MetricQueryType.QUERY),
        this.cfCellService.buildChartConfig('Available')
      ],
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_total_disk', MetricQueryType.QUERY),
        this.cfCellService.buildChartConfig('Memory Available (MB)')
      ],
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_total_memory', MetricQueryType.QUERY),
        this.cfCellService.buildChartConfig('Disk Available (MB)')
      ],
    ];

  }
}
