import { Component, OnInit } from '@angular/core';
import { KubernetesNodeService, KubeNodeMetric } from '../../services/kubernetes-node.service';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult, ChartSeries } from '../../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../../store/types/metric.types';
import { FetchKubernetesMetricsAction, FetchKubernetesChartMetricsAction } from '../../store/kubernetes.actions';
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
  ) {
    this.memoryMetric = KubeNodeMetric.MEMORY;
    this.cpuMetric = KubeNodeMetric.CPU;
  }

  ngOnInit() {
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(
      result => {
        const metric = result.metric;
        if (!!metric.pod_name && !!metric.namespace) {
          const containerName = `${metric.namespace}:${metric.pod_name}:${metric.container_name}`;
          if (!!metric.cpu) {
            return `${containerName}:${metric.cpu}`;
          }
          return containerName;
        }

        if (metric.name) {
          return metric.name;
        }

        return result.metric.id;

      },
    );

    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchKubernetesChartMetricsAction(
          this.kubeNodeService.nodeName,
          this.kubeNodeService.kubeGuid,
          `${KubeNodeMetric.MEMORY}{instance="${this.kubeNodeService.nodeName}"}`
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES,
        (series: ChartSeries[]) => {
          return series.filter(s => !(s.name.indexOf('/') === 0) && !s.name.endsWith('POD'));
        }
      ),
      chartConfigBuilder(
        new FetchKubernetesChartMetricsAction(
          this.kubeNodeService.nodeName,
          this.kubeNodeService.kubeGuid,
          `${KubeNodeMetric.CPU}{instance="${this.kubeNodeService.nodeName}"}`
        ),
        'CPU Usage (secs)',
        null,
        (series: ChartSeries[]) => {
          return series.filter(s => !(s.name.indexOf('/') === 0) && s.name.indexOf('POD') === -1);
        }
      )
    ];
  }

}
