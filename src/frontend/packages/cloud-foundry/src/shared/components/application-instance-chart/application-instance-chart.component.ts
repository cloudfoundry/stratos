import { Component, Input, OnInit , ChangeDetectionStrategy } from '@angular/core';

import { MetricsChartComponent, MetricsConfig, MetricsLineChartConfig, MetricsChartHelpers, MetricsRangeSelectorComponent } from '@stratosui/core';
import { MetricQueryConfig, IMetricMatrixResult, IMetricApplication, MetricQueryType, MetricsRequest } from '@stratosui/store';

const APP_METRICS_BASE_URL = '/pp/v1/metrics';

@Component({
  selector: 'app-application-instance-chart',
  templateUrl: './application-instance-chart.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MetricsChartComponent,
    MetricsRangeSelectorComponent
  ]
})
export class ApplicationInstanceChartComponent implements OnInit {

  @Input()
  private appGuid!: string;

  @Input()
  private endpointGuid!: string;

  @Input()
  private yAxisLabel!: string;

  // Prometheus query string
  @Input()
  private queryString!: string;

  @Input()
  private seriesTranslation!: string;

  @Input()
  private queryRange = false;

  @Input()
  public title!: string;

  public instanceChartConfig!: MetricsLineChartConfig;

  public instanceMetricConfig!: MetricsConfig<IMetricMatrixResult<IMetricApplication>>;

  constructor() { }

  ngOnInit() {
    this.instanceChartConfig = MetricsChartHelpers.buildChartConfig(this.yAxisLabel);
    const request: MetricsRequest = {
      endpointGuid: this.endpointGuid,
      url: `${APP_METRICS_BASE_URL}/cf/app/${this.appGuid}`,
      query: new MetricQueryConfig(this.queryString),
      queryType: this.queryRange ? MetricQueryType.RANGE_QUERY : MetricQueryType.QUERY,
      windowValue: null,
    };
    this.instanceMetricConfig = {
      getSeriesName: result => `Instance ${result.metric.instance_index}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.mapSeriesItemValue(),
      request,
    };
  }

  private mapSeriesItemValue() {
    switch (this.seriesTranslation) {
      case 'mb':
        return (bytes) => (bytes / 1000000).toFixed(2);
      default:
        return undefined;
    }
  }

}
