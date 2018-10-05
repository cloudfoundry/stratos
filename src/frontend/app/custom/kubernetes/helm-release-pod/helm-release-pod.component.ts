import { Component, OnInit } from '@angular/core';
import { HelmReleaseService } from '../services/helm-release.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { kubernetesPodsSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { KubernetesPod } from '../store/kube.types';
import { GetKubernetesPod, FetchKubernetesMetricsAction } from '../store/kubernetes.actions';
import { Observable } from 'rxjs';
import { EntityInfo } from '../../../store/types/api.types';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesService } from '../services/kubernetes.service';
import { map } from 'rxjs/operators';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { MetricsConfig } from '../../../shared/components/metrics-chart/metrics-chart.component';
import { IMetricMatrixResult } from '../../../store/types/base-metric.types';
import { IMetricApplication } from '../../../store/types/metric.types';
import { MetricsLineChartConfig } from '../../../shared/components/metrics-chart/metrics-chart.types';
import { MetricsChartHelpers } from '../../../shared/components/metrics-chart/metrics.component.helpers';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../store/actions/metrics.actions';

@Component({
  selector: 'app-helm-release-pod',
  templateUrl: './helm-release-pod.component.html',
  styleUrls: ['./helm-release-pod.component.scss'],
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
export class HelmReleasePodComponent implements OnInit {
  podName: string;
  podEntity$: Observable<EntityInfo<KubernetesPod>>;
  namespaceName: any;
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public instanceMetricConfigs: [
    MetricsConfig<IMetricMatrixResult<IMetricApplication>>,
    MetricsLineChartConfig
  ][];

  private buildChartConfig(yLabel: string) {
    const lineChartConfig = new MetricsLineChartConfig();
    lineChartConfig.xAxisLabel = 'Time';
    lineChartConfig.yAxisLabel = yLabel;
    return lineChartConfig;
  }

  constructor(
    public helmReleaseService: HelmReleaseService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public entityServiceFactory: EntityServiceFactory,
    public kubeEndpointService: KubernetesEndpointService
  ) {
    this.podName = activatedRoute.snapshot.params['podName'];
    this.namespaceName = getIdFromRoute(activatedRoute, 'namespaceName');

    this.instanceMetricConfigs = [
      [
        {
          getSeriesName: result => `Container ${result.metric.container_name}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          mapSeriesItemValue: (bytes) => (bytes / 1000000).toFixed(2),
          metricsAction: new FetchKubernetesMetricsAction(
            this.podName,
            helmReleaseService.kubeGuid,
            `container_memory_usage_bytes{pod_name="${this.podName}"}`
          )
        },
        this.buildChartConfig('Memory Usage (MB)')
      ],
      [
        {
          getSeriesName: result => `Container ${result.metric.container_name}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          metricsAction: new FetchKubernetesMetricsAction(
            this.podName,
            helmReleaseService.kubeGuid,
            `container_cpu_usage_seconds_total{pod_name="${this.podName}"}`
          )
        },
        this.buildChartConfig('CPU Usage (%)')
      ],
      [
        {
          getSeriesName: result => `Container ${result.metric.container_name}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          mapSeriesItemValue: (bytes) => (bytes / 1000000).toFixed(2),
          metricsAction: new FetchKubernetesMetricsAction(
            this.podName,
            helmReleaseService.kubeGuid,
            `container_network_transmit_bytes_total{pod_name="${this.podName}"}`
          )
        },
        this.buildChartConfig('Cumulative Data transmitted (MB)')
      ],
      [
        {
          getSeriesName: result => `Container ${result.metric.container_name}`,
          mapSeriesItemName: MetricsChartHelpers.getDateSeriesName,
          sort: MetricsChartHelpers.sortBySeriesName,
          mapSeriesItemValue: (bytes) => (bytes / 1000000).toFixed(2),
          metricsAction: new FetchKubernetesMetricsAction(
            this.podName,
            helmReleaseService.kubeGuid,
            `container_network_receive_bytes_total{pod_name="${this.podName}"}`
          )
        },
        this.buildChartConfig('Cumulative Data received (MB)')
      ]
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
