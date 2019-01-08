import { Component, OnInit, Input } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../store/types/base-metric.types';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../../store/actions/metrics.actions';
import { MetricsChartHelpers } from '../../../../shared/components/metrics-chart/metrics.component.helpers';
import { IMetricApplication } from '../../../../store/types/metric.types';
import { MetricQueryType } from '../../../../shared/services/metrics-range-selector.types';

@Component({
  selector: 'app-application-instance-chart',
  templateUrl: './application-instance-chart.component.html',
  styleUrls: ['./application-instance-chart.component.scss']
})
export class ApplicationInstanceChartComponent implements OnInit {

  @Input()
  private appGuid: string;

  @Input()
  private endpointGuid: string;

  @Input()
  private yAxisLabel: string;

  // Prometheus query string
  @Input()
  private queryString: string;

  @Input()
  private seriesTranslation: string;

  @Input()
  private queryRange = false;

  @Input()
  public title: string;

  public instanceChartConfig: MetricsLineChartConfig;

  public instanceMetricConfig: MetricsConfig<IMetricMatrixResult<IMetricApplication>>;

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
