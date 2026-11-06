import { Injectable, Injector, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter, map, publishReplay, refCount, take } from 'rxjs/operators';

import { getIdFromRoute } from '../../../../core/src/core/utils.service';
import { MetricQueryConfig } from '../../../../store/src/actions/metrics.actions';
import { MetricsDataService, MetricsRequest } from '../../../../store/src/services/metrics-data.service';
import { EntityInfo } from '../../../../store/src/types/api.types';
import { MetricQueryType } from '../../../../store/src/types/metric.types';
import { KubeNodeDataService } from '../../services/domain-data/kube-node-data.service';
import { KubernetesNode, MetricStatistic } from '../store/kube.types';
import { KubernetesEndpointService } from './kubernetes-endpoint.service';

const KUBE_METRICS_BASE_URL = '/pp/v1/metrics/kubernetes';

export enum KubeNodeMetric {
  CPU = 'container_cpu_usage_seconds_total',
  MEMORY = 'container_memory_usage_bytes'
}

@Injectable({
  providedIn: 'root'
})
export class KubernetesNodeService {
  kubeEndpointService = inject(KubernetesEndpointService);
  activatedRoute = inject(ActivatedRoute);
  private metricsDataService = inject(MetricsDataService);
  private nodeData = inject(KubeNodeDataService);
  private injector = inject(Injector);

  public nodeName: string;
  public kubeGuid: string;
  public node$: Observable<EntityInfo<KubernetesNode>>;
  nodeEntity$: Observable<KubernetesNode>;

  constructor() {
    const kubeEndpointService = this.kubeEndpointService;
    const activatedRoute = this.activatedRoute;

    this.nodeName = getIdFromRoute(activatedRoute, 'nodeName');
    this.kubeGuid = kubeEndpointService.kubeGuid;

    // Prime the cluster cache, then project the single node by name. The
    // data service returns the native KubeNode shape; consumers read the
    // structurally-identical k8s JSON via the legacy KubernetesNode type.
    void this.nodeData.refresh(this.kubeGuid);
    const node = this.nodeData.nodeByName(this.kubeGuid, this.nodeName);

    this.nodeEntity$ = toObservable(node, { injector: this.injector }).pipe(
      filter((n): n is NonNullable<typeof n> => !!n),
      take(1),
      map(n => n as unknown as KubernetesNode),
      publishReplay(1),
      refCount()
    );

    this.node$ = this.nodeEntity$.pipe(
      map(entity => ({ entity } as unknown as EntityInfo<KubernetesNode>))
    );
  }



  public setupMetricObservable(metric: KubeNodeMetric, metricStatistic: MetricStatistic) {
    const containerFilter = ',container!="POD", container!=""';
    const query = `${metricStatistic}(${metricStatistic}_over_time(${metric}{kubernetes_io_hostname="${this.nodeName}"${containerFilter}}[1h]))`;
    const request: MetricsRequest = {
      endpointGuid: this.kubeGuid,
      url: `${KUBE_METRICS_BASE_URL}/${this.nodeName}`,
      query: new MetricQueryConfig(query),
      queryType: MetricQueryType.QUERY,
      windowValue: null,
    };
    const requestSignal = signal(request);
    const observation = this.metricsDataService.observe<any>(requestSignal, { pollIntervalMs: 30000 });
    const entity$ = toObservable(observation.metrics, { injector: this.injector }).pipe(
      filter(metrics => !!metrics),
      map(metrics => {
        const result = metrics?.data?.result;
        return result && result.length === 1 ? Number(result[0].value[1]) : 0;
      })
    );
    const pollerSub: Subscription = { unsubscribe: () => observation.stop() } as Subscription;
    return { entity$, pollerSub };
  }
}
