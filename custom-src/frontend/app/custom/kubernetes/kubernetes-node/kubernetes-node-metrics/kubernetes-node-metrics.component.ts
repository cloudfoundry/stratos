import { Component, OnInit } from '@angular/core';
import { KubernetesNodeService, KubeNodeMetric } from '../../services/kubernetes-node.service';
import { MetricsLineChartConfig } from '../../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsConfig } from '../../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult, ChartSeries } from '../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../store/src/types/metric.types';
import { FetchKubernetesChartMetricsAction } from '../../store/kubernetes.actions';
import { ChartDataTypes, getMetricsChartConfigBuilder } from '../../../../shared/components/metrics-chart/metrics.component.helpers';
import { formatCPUTime, formatAxisCPUTime } from '../../kubernetes-metrics.helpers';

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
        if (!!metric.pod && !!metric.namespace) {
          const containerName = `${metric.namespace}:${metric.pod}:${metric.container}`;
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
          return series.filter(s => s.name.indexOf('/') !== 0 && !!s.metadata.container && s.metadata.container !== 'POD');
        },
        null,
        (value: string) => value + ' MB'
      ),
      chartConfigBuilder(
        new FetchKubernetesChartMetricsAction(
          this.kubeNodeService.nodeName,
          this.kubeNodeService.kubeGuid,
          `${KubeNodeMetric.CPU}{instance="${this.kubeNodeService.nodeName}"}`
        ),
        'CPU Usage (secs)',
        ChartDataTypes.CPU_TIME,
        (series: ChartSeries[]) => {
          return series.filter(s => s.name.indexOf('/') !== 0 && !!s.metadata.container && s.metadata.container !== 'POD');
        },
        (t) => formatAxisCPUTime(t),
        (t) => formatCPUTime(t)
      )
    ];
  }

}
