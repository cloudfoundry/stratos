// import { Component, Input, OnInit } from '@angular/core';

// import { MetricsConfig } from '../../../../../shared/components/metrics-chart/metrics-chart.component';
// import { MetricsLineChartConfig } from '../../../../../shared/components/metrics-chart/metrics-chart.types';
// import { MetricsChartHelpers } from '../../../../../shared/components/metrics-chart/metrics.component.helpers';
// import { MetricQueryType } from '../../../../../shared/services/metrics-range-selector.types';
// import { FetchCFCellMetricsAction, MetricQueryConfig } from '../../../../../store/actions/metrics.actions';
// import { IMetricMatrixResult } from '../../../../../store/types/base-metric.types';
// import { IMetricCell } from '../../../../../store/types/metric.types';


// @Component({
//   selector: 'app-cf-cell-summary-chart',
//   templateUrl: './cf-cell-summary-chart.component.html',
//   styleUrls: ['./cf-cell-summary-chart.component.scss']
// })
// export class CfCellSummaryChartComponent implements OnInit {

//   @Input()
//   private cellId: string;

//   @Input()
//   private endpointGuid: string;

//   @Input()
//   private yAxisLabel: string;

//   @Input()
//   private showLegend = true;

//   // Prometheus query string
//   @Input()
//   private queryString: string;

//   @Input()
//   private seriesTranslation: string;

//   @Input()
//   private queryRange = false;

//   @Input()
//   public title: string;

//   public chartConfig: MetricsLineChartConfig;

//   public metricConfig: MetricsConfig<IMetricMatrixResult<IMetricCell>>;

//   constructor() { }

//   private buildChartConfig() {
//     const lineChartConfig = new MetricsLineChartConfig();
//     lineChartConfig.xAxisLabel = 'Time';
//     lineChartConfig.yAxisLabel = this.yAxisLabel;
//     lineChartConfig.showLegend = this.showLegend;
//     return lineChartConfig;
//   }

//   ngOnInit() {
//     this.chartConfig = this.buildChartConfig();
//     this.metricConfig = {
//       getSeriesName: result => `Cell ${result.metric.bosh_job_name} (${result.metric.bosh_job_id})`,
//       mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
//       sort: MetricsChartHelpers.sortBySeriesName,
//       // mapSeriesItemValue: this.mapSeriesItemValue(),
//       metricsAction: new FetchCFCellMetricsAction(
//         this.endpointGuid,
//         this.cellId,
//         new MetricQueryConfig(this.queryString),
//         // TODO: RC MetricQueryType.RANGE_QUERY causes failure
//         this.queryRange ? MetricQueryType.RANGE_QUERY : MetricQueryType.QUERY
//         // MetricQueryType.QUERY
//       ),
//     };
//   }

// }
