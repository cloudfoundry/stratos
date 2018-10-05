import { Component, OnInit, Input } from '@angular/core';
import { MetricsLineChartConfig } from '../../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../../store/types/base-metric.types';
import { MetricsChartHelpers } from '../../../../../shared/components/metrics-chart/metrics.component.helpers';
import { IMetricApplication } from '../../../../../store/types/metric.types';
import { FetchKubernetesMetricsAction } from '../../../store/kubernetes.actions';

@Component({
  selector: 'app-pod-chart',
  templateUrl: './pod-chart.component.html',
  styleUrls: ['./pod-chart.component.scss']
})
export class PodChartComponent implements OnInit {

  @Input()
  private podName: string;

  @Input()
  private aggregate: string;

  @Input()
  private endpointGuid: string;

  @Input()
  private yAxisLabel: string;

  @Input()
  private metricName: string;

  @Input()
  private seriesTranslation: string;

  @Input()
  public title: string;

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

    const query = `${this.metricName}{pod_name="${this.podName}"}[1h]&time=${(new Date()).getTime() / 1000}`;
    this.instanceMetricConfig = {
      getSeriesName: result => `Container ${result.metric.container_name}`,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.getmapSeriesItemValue(),
      metricsAction: new FetchKubernetesMetricsAction(
        this.podName,
        this.endpointGuid,
        query,
      ),
    };
  }

  private getmapSeriesItemValue() {
    switch (this.seriesTranslation) {
      case 'mb':
        return (bytes) => bytes / 1000000;
      default:
        return undefined;
    }
  }
}

