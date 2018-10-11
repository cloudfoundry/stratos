import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { MetricsConfig } from '../../../shared/components/metrics-chart/metrics-chart.component';
import { MetricsLineChartConfig } from '../../../shared/components/metrics-chart/metrics-chart.types';
import { getMetricsChartConfigBuilder, ChartDataTypes } from '../../../shared/components/metrics-chart/metrics.component.helpers';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { AppState } from '../../../store/app-state';
import { entityFactory, kubernetesPodsSchemaKey } from '../../../store/helpers/entity-factory';
import { EntityInfo } from '../../../store/types/api.types';
import { IMetricMatrixResult } from '../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../store/types/metric.types';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { HelmReleaseService } from '../services/helm-release.service';
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
          guid: activatedRoute.snapshot.params.kubeId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    HelmReleaseService,
    KubernetesEndpointService
  ]
})
export class PodMetricsComponent implements OnInit {
  podName: string;
  podEntity$: Observable<EntityInfo<KubernetesPod>>;
  namespaceName: any;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];

  constructor(
    public helmReleaseService: HelmReleaseService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public entityServiceFactory: EntityServiceFactory,
    public kubeEndpointService: KubernetesEndpointService
  ) {
    this.podName = activatedRoute.snapshot.params['podName'];
    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');
    const namespace = getIdFromRoute(activatedRoute, 'namespace') ? getIdFromRoute(activatedRoute, 'namespace') : this.namespaceName;
    const chartConfigBuilder = getMetricsChartConfigBuilder<IMetricApplication>(result => `Container ${result.metric.container_name}`);
    this.instanceMetricConfigs = [
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          helmReleaseService.kubeGuid,
          `container_memory_usage_bytes{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'Memory Usage (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          helmReleaseService.kubeGuid,
          `container_cpu_usage_seconds_total{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'CPU Usage (%)'
      ),
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          helmReleaseService.kubeGuid,
          `container_network_transmit_bytes_total{pod_name="${this.podName}",namespace="${namespace}"}`
        ),
        'Cumulative Data transmitted (MB)',
        ChartDataTypes.BYTES
      ),
      chartConfigBuilder(
        new FetchKubernetesMetricsAction(
          this.podName,
          helmReleaseService.kubeGuid,
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
      kubernetesPodsSchemaKey,
      entityFactory(kubernetesPodsSchemaKey),
      this.podName,
      new GetKubernetesPod(this.podName, this.namespaceName, this.helmReleaseService.kubeGuid),
      false
    ).entityObs$;
  }

  ngOnInit() {
  }

}
