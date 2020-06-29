import { Component, OnInit } from '@angular/core';

import { MetricsConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  ChartDataTypes,
  getMetricsChartConfigBuilder,
} from '../../../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import { ChartSeries, IMetricMatrixResult } from '../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../store/src/types/metric.types';
import { formatAxisCPUTime, formatCPUTime } from '../../kubernetes-metrics.helpers';
import { KubeNodeMetric, KubernetesNodeService } from '../../services/kubernetes-node.service';
import { FetchKubernetesChartMetricsAction } from '../../store/kubernetes.actions';

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
