import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, shareReplay } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { MetricQueryConfig, MetricsAction } from '../../../../../store/src/actions/metrics.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { EntityInfo } from '../../../../../store/src/types/api.types';
import { MetricQueryType } from '../../../../../store/src/types/metric.types';
import { kubeEntityCatalog } from '../kubernetes-entity-catalog';
import { KubernetesNode, MetricStatistic } from '../store/kube.types';
import { FetchKubernetesMetricsAction } from '../store/kubernetes.actions';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';


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
    public entityMonitorFactory: EntityMonitorFactory
  ) {
    this.nodeName = getIdFromRoute(activatedRoute, 'nodeName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    const nodeEntityService = kubeEntityCatalog.node.store.getEntityService(this.nodeName, this.kubeGuid);

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
    const containerFilter = ',container!="POD", container!=""';
    const query = `${metricStatistic}(${metricStatistic}_over_time(${metric}{kubernetes_io_hostname="${this.nodeName}"${containerFilter}}[1h]))`;
    const metricsAction = new FetchKubernetesMetricsAction(this.nodeName, this.kubeGuid, query);
    const metricsId = MetricsAction.buildMetricKey(this.nodeName, new MetricQueryConfig(query), true, MetricQueryType.QUERY);
    const metricsMonitor = this.entityMonitorFactory.create<any>(metricsId, metricsAction);
    this.store.dispatch(metricsAction);
    const pollSub = metricsMonitor.poll(30000, () => this.store.dispatch(metricsAction),
      request => ({ busy: request.fetching, error: request.error, message: request.message }))
      .subscribe();
    return {
      entity$: metricsMonitor.entity$.pipe(filter(metrics => !!metrics), map(metrics => {
        const result = metrics.data && metrics.data.result;
        if (!!result && result.length === 1) {
          return result[0].value[1];
        } else {
          return 0;
        }
      })),
      pollerSub: pollSub
    };
  }
}
