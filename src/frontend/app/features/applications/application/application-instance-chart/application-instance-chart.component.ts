import { Component, OnInit, Input } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../store/types/base-metric.types';
import { FetchApplicationMetricsAction } from '../../../../store/actions/metrics.actions';
import { MetricsChartHelpers } from '../../../../shared/components/metrics-chart/metrics.component.helpers';
import { IMetricApplication } from '../../../../store/types/metric.types';

@Component({
  selector: 'app-application-instance-chart',
  templateUrl: './application-instance-chart.component.html',
  styleUrls: ['./application-instance-chart.component.scss']
})
export class ApplicationInstanceChartComponent implements OnInit {

  @Input('appGuid')
  private appGuid: string;

  @Input('endpointGuid')
  private endpointGuid: string;

  @Input("yAxisLabel")
  private yAxisLabel: string;

  @Input("metricName")
  private metricName: string;

  @Input("seriesTranslation")
  private seriesTranslation: string;

  @Input("title")
  private title: string;

  public instanceChartConfig: MetricsLineChartConfig;

  public instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>>;

  constructor() { }

  private buildChartConfig() {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = this.yAxisLabel;
    return lineChartConfig;
  }

  ngOnInit() {
    this.instanceChartConfig = this.buildChartConfig();
    this.instanceMetricConfig = {
      getSeriesName: result => `Instance ${result.metric.instance_index}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.getmapSeriesItemValue(),
      metricsAction: new FetchApplicationMetricsAction(
        this.appGuid,
        this.endpointGuid,
        this.metricName,
      ),
    };
  }

  private getmapSeriesItemValue() {
    switch(this.seriesTranslation) {
      case 'mb':
        return (bytes) => bytes / 1000000;
      default:
        return undefined;
    }
  }

}
