import { Component, Input, OnInit , ChangeDetectionStrategy } from '@angular/core';

import { MetricsChartComponent, MetricsConfig, MetricsLineChartConfig, MetricsChartHelpers, MetricsRangeSelectorComponent } from '@stratosui/core';
import { MetricQueryConfig, IMetricMatrixResult, IMetricApplication, MetricQueryType } from '@stratosui/store';
import { FetchApplicationMetricsAction } from '../../../actions/cf-metrics.actions';

@Component({
  selector: 'app-application-instance-chart',
  templateUrl: './application-instance-chart.component.html',
  styleUrls: ['./application-instance-chart.component.scss'],
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
    this.instanceMetricConfig = {
      getSeriesName: result => `Instance ${result.metric.instance_index}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.mapSeriesItemValue(),
      metricsAction: new FetchApplicationMetricsAction(
        this.appGuid,
        this.endpointGuid,
        new MetricQueryConfig(this.queryString),
        this.queryRange ? MetricQueryType.RANGE_QUERY : MetricQueryType.QUERY
      ),
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
