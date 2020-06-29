import { Component, Input, OnInit } from '@angular/core';

import { MetricsConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  MetricsChartHelpers,
} from '../../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { IMetricMatrixResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../../store/src/types/metric.types';
import { FetchKubernetesMetricsAction } from '../../../store/kubernetes.actions';

@Component({
  selector: 'app-kubernetes-node-metrics-chart',
  templateUrl: './kubernetes-node-metrics-chart.component.html',
  styleUrls: ['./kubernetes-node-metrics-chart.component.scss']
})
export class KubernetesNodeMetricsChartComponent implements OnInit {

  @Input()
  private nodeName: string;
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

  ngOnInit() {
    this.instanceChartConfig = MetricsChartHelpers.buildChartConfig(this.yAxisLabel);
    const query = `${this.metricName}{instance="${this.nodeName}"}[1h]&time=${(new Date()).getTime() / 1000}`;
    this.instanceMetricConfig = {
      getSeriesName: result => result.metric.name ? result.metric.name : result.metric.id,
      mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
      sort: MetricsChartHelpers.sortBySeriesName,
      mapSeriesItemValue: this.getmapSeriesItemValue(),
      metricsAction: new FetchKubernetesMetricsAction(
        this.nodeName,
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
