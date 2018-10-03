import { Component, OnInit } from '@angular/core';

import { MetricsConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsRangeSelectorManagerService,
} from '../../../../../../shared/services/metrics-range-selector-manager.service';
import { MetricQueryType } from '../../../../../../shared/services/metrics-range-selector.types';
import { IMetricMatrixResult } from '../../../../../../store/types/base-metric.types';
import { IMetricCell } from '../../../../../../store/types/metric.types';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';
import { MetricsRangeSelectorService } from '../../../../../../shared/services/metrics-range-selector.service';

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
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_remaining_containers', MetricQueryType.RANGE_QUERY),
        this.cfCellService.buildChartConfig('Containers Remaining')
      ],
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_remaining_memory', MetricQueryType.QUERY),
        this.cfCellService.buildChartConfig('Memory Remaining (MB)')
      ],
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_remaining_disk', MetricQueryType.QUERY),
        this.cfCellService.buildChartConfig('Disk Remaining (MB)')
      ],
    ];

  }
}
