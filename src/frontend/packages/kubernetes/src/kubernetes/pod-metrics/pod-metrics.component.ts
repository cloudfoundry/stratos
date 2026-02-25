import { AsyncPipe } from '@angular/common';
import {Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/src/core/utils.service';
import { MetricsChartComponent, MetricsConfig } from '../../../../core/src/shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../../core/src/shared/components/metrics-chart/metrics-chart.types';
import {
  ChartDataTypes,
  getMetricsChartConfigBuilder,
} from '../../../../core/src/shared/components/metrics-chart/metrics.component.helpers';
import {
  MetricsParentRangeSelectorComponent,
} from '../../../../core/src/shared/components/metrics-parent-range-selector/metrics-parent-range-selector.component';
import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../core/src/shared/components/page-header/page-header.types';
import { EntityInfo } from '../../../../store/src/types/api.types';
import { ChartSeries, IMetricMatrixResult } from '../../../../store/src/types/base-metric.types';
import { kubeEntityCatalog } from '../kubernetes-entity-generator';
import { formatAxisCPUTime, formatCPUTime } from '../kubernetes-metrics.helpers';
import { IKubernetesMetric } from '../kubernetes-metric.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesPod } from '../store/kube.types';
import { FetchKubernetesMetricsAction } from '../store/kubernetes.actions';

@Component({
  selector: 'app-pod-metrics',
  templateUrl: './pod-metrics.component.html',
  styleUrls: ['./pod-metrics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    PageHeaderComponent,
    MetricsParentRangeSelectorComponent,
    MetricsChartComponent
],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService
  ]
})
export class PodMetricsComponent {
  podName: string;
  podEntity$: Observable<EntityInfo<KubernetesPod>>;
  namespaceName: string;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IKubernetesMetric>>,
    MetricsLineChartConfig
  ][] = [];
  public activatedRoute = inject(ActivatedRoute);
  public kubeEndpointService = inject(KubernetesEndpointService);



  constructor() {


    this.podName = this.activatedRoute.snapshot.params.podName;
    this.namespaceName = getIdFromRoute(this.activatedRoute, 'namespaceName');
    const namespace = getIdFromRoute(this.activatedRoute, 'namespace') ? getIdFromRoute(this.activatedRoute, 'namespace') : this.namespaceName;
    const chartConfigBuilder = getMetricsChartConfigBuilder<IKubernetesMetric>(result => `${result.metric.container || ''}`);
    const cpuChartConfigBuilder = getMetricsChartConfigBuilder<IKubernetesMetric>(
      result => result.metric.cpu ? `${result.metric.container || ''}:${result.metric.cpu}` : `${result.metric.container || ''}`
    );
    const networkChartConfigBuilder = getMetricsChartConfigBuilder<IKubernetesMetric>(
      result => `Network Interface: ${result.metric.interface || ''}`
    );
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          this.kubeEndpointService.kubeGuid,
          `container_memory_usage_bytes{pod="${this.podName}",namespace="${namespace}"}`
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES,
        (series: ChartSeries[]) => {
          // Remove the metric series for pod overhead and for the total!
          return series.filter(s => {
            const metadata = s.metadata as IKubernetesMetric;
            return !!metadata.container && metadata.container !== 'POD';
          });
        },
        null,
        (value: string) => value + ' MB'
      ),
      cpuChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          this.kubeEndpointService.kubeGuid,
          `container_cpu_usage_seconds_total{pod="${this.podName}",namespace="${namespace}"}`
        ),
        'CPU Usage',
        ChartDataTypes.CPU_TIME,
        (series: ChartSeries[]) => {
          return series.filter(s => {
            const metadata = s.metadata as IKubernetesMetric;
            return !!metadata.container && metadata.container !== 'POD';
          });
        },
        (tick: string) => formatAxisCPUTime(tick),
        (value: string) => formatCPUTime(value),
      ),
      networkChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          this.kubeEndpointService.kubeGuid,
          `container_network_transmit_bytes_total{pod="${this.podName}",namespace="${namespace}"}`
        ),
        'Cumulative Data transmitted (MB)',
        ChartDataTypes.BYTES,
        null,
        null,
        (value: string) => value + ' MB'
      ),
      networkChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          this.kubeEndpointService.kubeGuid,
          `container_network_receive_bytes_total{pod="${this.podName}",namespace="${namespace}"}`
        ),
        'Cumulative Data received (MB)',
        ChartDataTypes.BYTES,
        null,
        null,
        (value: string) => value + ' MB'
      )
    ];


    this.breadcrumbs$ = this.kubeEndpointService.endpoint$.pipe(
      map(endpoint => {

        // check if this is being invoked from the node path
        const nodeName = getIdFromRoute(this.activatedRoute, 'nodeName');
        if (!!nodeName) {
          return [{
            breadcrumbs: [
              { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}/nodes` },
              { value: nodeName, routerLink: `/kubernetes/${endpoint.entity.guid}/nodes/${nodeName}/pods` },
            ]
          }];
        }
        // check if this is being invoked from the namespace path
        if (!!this.namespaceName) {
          return [{
            breadcrumbs: [
              { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}/namespaces` },
              { value: this.namespaceName, routerLink: `/kubernetes/${endpoint.entity.guid}/namespaces/${this.namespaceName}/pods` },
            ]
          }];
        }
        // Finally, check if this is being invoked from the helm-release path
        const releaseName = getIdFromRoute(this.activatedRoute, 'releaseName');
        if (!!releaseName) {
          return [{
            breadcrumbs: [
              { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}/apps` },
              { value: releaseName, routerLink: `/kubernetes/${endpoint.entity.guid}/apps/${releaseName}/pods` },
            ]
          }];
        }
        return [{
          breadcrumbs: [
            { value: endpoint.entity.name, routerLink: `/kubernetes/${endpoint.entity.guid}/pods` },
          ]
        }];
      })
    );
    this.podEntity$ = kubeEntityCatalog.pod.store.getEntityService(this.podName, this.kubeEndpointService.kubeGuid, {
      namespace: this.namespaceName
    }).entityObs$;


  }
}
