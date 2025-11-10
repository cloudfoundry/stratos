import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { MetricsConfig, MetricsChartComponent, MetricsLineChartConfig, MetricsParentRangeSelectorComponent } from '@stratosui/core';
import { IMetricMatrixResult, IMetricCell, MetricQueryType } from '@stratosui/store';
import { CloudFoundryCellService } from '../cloud-foundry-cell.service';

@Component({
  selector: 'app-cloud-foundry-cell-charts',
  templateUrl: './cloud-foundry-cell-charts.component.html',
  styleUrls: ['./cloud-foundry-cell-charts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MetricsChartComponent,
    MetricsParentRangeSelectorComponent
]
})
export class CloudFoundryCellChartsComponent {
  public cfCellService = inject(CloudFoundryCellService);

  public metricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricCell>>,
    MetricsLineChartConfig
  ][];

  constructor() {
    this.metricConfigs = [
      [
        this.cfCellService.buildMetricConfig('firehose_value_metric_rep_capacity_remaining_containers', MetricQueryType.RANGE_QUERY),
        {
          ...this.cfCellService.buildChartConfig('Containers Remaining'),
          yAxisTickFormatting: (label: string) => Math.round(Number(label)).toString()
        }
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
