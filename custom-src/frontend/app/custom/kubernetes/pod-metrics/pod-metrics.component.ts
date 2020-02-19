import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { ChartSeries, IMetricMatrixResult } from '../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../store/src/types/metric.types';
import { getIdFromRoute } from '../../../core/utils.service';
import { MetricsConfig } from '../../../shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../shared/components/metrics-chart/metrics-chart.types';
import {
  ChartDataTypes,
  getMetricsChartConfigBuilder,
} from '../../../shared/components/metrics-chart/metrics.component.helpers';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesService } from '../services/kubernetes.service';
import { KubernetesPod } from '../store/kube.types';
import { FetchKubernetesMetricsAction, GetKubernetesPod } from '../store/kubernetes.actions';

@Component({
  selector: 'app-pod-metrics',
  templateUrl: './pod-metrics.component.html',
  styleUrls: ['./pod-metrics.component.scss'],
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
  namespaceName: any;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];

  constructor(
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public entityServiceFactory: EntityServiceFactory,
    public kubeEndpointService: KubernetesEndpointService
  ) {
    this.podName = activatedRoute.snapshot.params.podName;
    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    const namespace = getIdFromRoute(activatedRoute, 'namespace') ? getIdFromRoute(activatedRoute, 'namespace') : this.namespaceName;
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(result => `${result.metric.container_name}`);
    const cpuChartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>
      (result => !!result.metric.cpu ? `${result.metric.container_name}:${result.metric.cpu}` : `${result.metric.container_name}`);
    const networkChartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>
      (result => `Network Interface: ${result.metric.interface}`);
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          kubeEndpointService.kubeGuid,
          `container_memory_usage_bytes{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES,
        (series: ChartSeries[]) => {
          return series.filter(s => !s.name.endsWith('POD'));
        }
      ),
      cpuChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          kubeEndpointService.kubeGuid,
          `container_cpu_usage_seconds_total{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'CPU Usage',
        null,
        (series: ChartSeries[]) => {
          return series.filter(s => s.name.indexOf('POD') === -1);
        },
        (tick: string) => {
          const duration = moment.duration(parseFloat(tick) * 1000);
          if (duration.asDays() >= 1) {
            return `${duration.asDays().toPrecision(2)} d`;
          }
          if (duration.asHours() >= 1) {
            return `${duration.asHours().toPrecision(2)} hrs`;
          }
          if (duration.asMinutes() >= 1) {
            return `${duration.asMinutes().toPrecision(2)} min`;
          }
          if (duration.asSeconds() >= 1) {
            return `${duration.asSeconds().toPrecision(2)} sec`;
          }
          if (duration.asMilliseconds() >= 1) {
            return `${duration.asSeconds().toPrecision(2)} msec`;
          }
          return tick;
        }
      ),
      networkChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          kubeEndpointService.kubeGuid,
          `container_network_transmit_bytes_total{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'Cumulative Data transmitted (MB)',
        ChartDataTypes.BYTES
      ),
      networkChartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          kubeEndpointService.kubeGuid,
          `container_network_receive_bytes_total{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'Cumulative Data received (MB)',
        ChartDataTypes.BYTES
      )
    ];


    this.breadcrumbs$ = kubeEndpointService.endpoint$.pipe(
      map(endpoint => {

        // check if this is being invoked from the node path
        const nodeName = getIdFromRoute(activatedRoute, 'nodeName');
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
        const releaseName = getIdFromRoute(activatedRoute, 'releaseName');
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
    this.podEntity$ = this.entityServiceFactory.create<KubernetesPod>(
      this.podName,
      new GetKubernetesPod(this.podName, this.namespaceName, this.kubeEndpointService.kubeGuid),
    ).entityObs$;
  }
}
