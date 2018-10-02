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
export class CloudFoundryCellChartsComponent implements OnInit {

  public metricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricCell>>,
    MetricsLineChartConfig
  ][];

  constructor(
    public cfCellService: CloudFoundryCellService,
  ) {
    // private rangeSelectorManager: MetricsRangeSelectorManagerService,
    // private rangeSelectorService: MetricsRangeSelectorService

    this.metricConfigs = [
      [
        this.cfCellService.buildMetricConfig(cfCellService.createPercentageMetric(
          'firehose_value_metric_rep_capacity_remaining_containers',
          'firehose_value_metric_rep_capacity_total_containers'),
          MetricQueryType.RANGE_QUERY),
        this.cfCellService.buildChartConfig('Containers Used (%)')
      ],
      [
        this.cfCellService.buildMetricConfig(cfCellService.createPercentageMetric(
          'firehose_value_metric_rep_capacity_remaining_memory',
          'firehose_value_metric_rep_capacity_total_memory'),
          MetricQueryType.RANGE_QUERY),
        this.cfCellService.buildChartConfig('Memory Used (%)')
      ],
      [
        this.cfCellService.buildMetricConfig(cfCellService.createPercentageMetric(
          'firehose_value_metric_rep_capacity_remaining_disk',
          'firehose_value_metric_rep_capacity_total_disk'),
          MetricQueryType.RANGE_QUERY),
        this.cfCellService.buildChartConfig('Disk Used (%)')
      ],
    ];

  }

  ngOnInit() {
    // this.rangeSelectorManager.selectedTimeRange(this.rangeSelectorService[3]);
  }
}
