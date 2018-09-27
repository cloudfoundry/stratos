import { MetricsAction } from './../../../store/actions/metrics.actions';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';
import { MetricsChartHelpers } from '../../../shared/components/metrics-chart/metrics.component.helpers';
import { MetricsConfig } from '../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../store/types/metric.types';
import { MetricsLineChartConfig } from '../../../shared/components/metrics-chart/metrics-chart.types';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  instanceChartConfig: MetricsLineChartConfig;

  constructor(private store: Store<AppState>) {
    this.instanceChartConfig = this.buildChartConfig();
  }

  instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>> = {
    getSeriesName: result => `Instance ${result.metric.instance_index}`,
    mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
    sort: MetricsChartHelpers.sortBySeriesName,
    mapSeriesItemValue: this.mapSeriesItemValue(),
    metricsAction: new FetchApplicationMetricsAction(
      'fbb2e26f-491f-468c-8d5b-ed02028f7106',
      'rqljU7j5TF-v8_nyozXsd6kDUeU',
      new MetricQueryConfig('firehose_container_metric_cpu_percentage')
    )
  };

  private mapSeriesItemValue() {
    return (bytes) => (bytes / 1000000).toFixed(2);
  }


  private buildChartConfig() {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = 'test';
    return lineChartConfig;
  }



  ngOnInit() { }
}
