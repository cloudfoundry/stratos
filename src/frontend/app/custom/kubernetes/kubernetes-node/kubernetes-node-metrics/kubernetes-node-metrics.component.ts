import { Component, OnInit } from '@angular/core';
import { KubernetesNodeService, KubeNodeMetric } from '../../services/kubernetes-node.service';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../store/types/metric.types';
import { FetchKubernetesMetricsAction } from '../../store/kubernetes.actions';
import { ChartDataTypes, getMetricsChartConfigBuilder } from '../../../../shared/components/metrics-chart/metrics.component.helpers';

@Component({
  selector: 'app-kubernetes-node-metrics',
  templateUrl: './kubernetes-node-metrics.component.html',
  styleUrls: ['./kubernetes-node-metrics.component.scss']
})
export class KubernetesNodeMetricsComponent implements OnInit {
  memoryMetric: KubeNodeMetric;
  cpuMetric: KubeNodeMetric;
  memoryUnit: string;
  cpuUnit: string;

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];

  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(
      result => result.metric.name ? result.metric.name : result.metric.id
    );
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.kubeNodeService.nodeName,
          this.kubeNodeService.kubeGuid,
          `${KubeNodeMetric.MEMORY}{instance="${this.kubeNodeService.nodeName}"}`
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.kubeNodeService.nodeName,
          this.kubeNodeService.kubeGuid,
          `${KubeNodeMetric.CPU}{instance="${this.kubeNodeService.nodeName}"}`
        ),
        'CPU Usage (%)'
      )
    ];
  }

}
