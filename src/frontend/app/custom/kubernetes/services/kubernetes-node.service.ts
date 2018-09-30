import { Injectable } from '@angular/core';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { KubernetesNode, MetricStatistic } from '../store/kube.types';
import { kubernetesNodesSchemaKey, entityFactory, metricSchemaKey } from '../../../store/helpers/entity-factory';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { GetKubernetesNode, FetchKubernetesMetricsAction } from '../store/kubernetes.actions';
import { first, shareReplay, filter, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EntityInfo } from '../../../store/types/api.types';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { IMetrics } from '../../../store/types/base-metric.types';
import { MetricsAction } from '../../../store/actions/metrics.actions';


export enum KubeNodeMetric {
  CPU = 'container_cpu_usage_seconds_total',
  MEMORY = 'container_memory_usage_bytes'
}

@Injectable()
export class KubernetesNodeService {
  public nodeName: string;
  public kubeGuid: string;
  public node$: Observable<EntityInfo<KubernetesNode>>;
  nodeEntity$: Observable<KubernetesNode>;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public activatedRoute: ActivatedRoute,
    public store: Store<AppState>,
    public paginationMonitorFactory: PaginationMonitorFactory,
    public entityServiceFactory: EntityServiceFactory,
    public entityMonitorFactory: EntityMonitorFactory

  ) {
    this.nodeName = getIdFromRoute(activatedRoute, 'nodeName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    const nodeEntityService = this.entityServiceFactory.create<KubernetesNode>(
      kubernetesNodesSchemaKey,
      entityFactory(kubernetesNodesSchemaKey),
      this.nodeName,
      new GetKubernetesNode(this.nodeName, this.kubeGuid),
      false
    );

    this.node$ = nodeEntityService.entityObs$.pipe(
      filter(p => !!p && !!p.entity),
      first(),
      shareReplay(1),
    );


    this.nodeEntity$ = this.node$.pipe(
      map(p => p.entity)
    );
  }



  public setupMetricObservable(metric: KubeNodeMetric, metricStatistic: MetricStatistic) {

    const query = `${metricStatistic}(${metricStatistic}_over_time(${metric}{kubernetes_io_hostname="${this.nodeName}"}[1h]))`;
    const metricsAction = new FetchKubernetesMetricsAction(this.nodeName, this.kubeGuid, query);
    const metricsId =  MetricsAction.buildMetricKey(this.nodeName, query);
    const metricsMonitor = this.entityMonitorFactory.create<IMetrics>(metricsId, metricSchemaKey, entityFactory(metricSchemaKey));
    this.store.dispatch(metricsAction);
    const pollSub = metricsMonitor.poll(30000, () => this.store.dispatch(metricsAction),
    request => ({ busy: request.fetching, error: request.error, message: request.message }))
    .subscribe();
    return {
      entity$: metricsMonitor.entity$.pipe(filter(metrics => !!metrics), map(metrics => {
        return metrics.result[0].value[1];
      })),
      pollerSub: pollSub
    };
  }
}
