import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, publishReplay, refCount, switchMap, tap } from 'rxjs/operators';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { AppState, EndpointModel } from '../../../../../../../../store/src/public-api';
import { AuthState } from '../../../../../../../../store/src/reducers/auth.reducer';
import { stratosEntityCatalog } from '../../../../../../../../store/src/stratos-entity-catalog';
import { EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { IMetricMatrixResult, IMetrics } from '../../../../../../../../store/src/types/base-metric.types';
import { EndpointsRelation } from '../../../../../../../../store/src/types/endpoint.types';
import { CfRelationTypes } from '../../../../../../cf-relation-types';
import { ListAppInstance } from '../app-instance-types';

@Component({
  selector: 'app-table-cell-kube-node',
  templateUrl: './table-cell-kube-node.component.html',
  styleUrls: ['./table-cell-kube-node.component.scss']
})
export class TableCellKubeNodeComponent extends TableCellCustom<ListAppInstance> {

  nodeName$: Observable<string>;
  nodeUrl$: Observable<string>;
  private fetchMetricsSub: Subscription;

  @Input('config')
  set config(config: {
    eiriniMetricsEndpoint: EndpointModel,
    eiriniRelationship: EndpointsRelation,
    eiriniPodsService: EntityService<IMetrics<IMetricMatrixResult<{ pod: string, node: string; }>>>;
  }) {
    if (!config || !config.eiriniPodsService || this.nodeName$) {
      return;
    }

    this.nodeName$ = config.eiriniPodsService.waitForEntity$.pipe(
      distinctUntilChanged(),
      filter(entityInfo => !!entityInfo.entity.data && !!entityInfo.entity.data.result),
      map((entityInfo) => {
        const metricResult = entityInfo.entity.data.result.find(res => this.getInstanceId(res.metric.pod) === this.row.index.toString());
        return metricResult ? metricResult.metric.node : null;
      }),
      tap(metric => {
        // No metric? It should exist so start polling to ensure we fetch it. It could be missing if the instance was just created
        // and cf hasn't yet emitted metrics for it
        if (!metric && !this.fetchMetricsSub) {
          this.fetchMetricsSub = config.eiriniPodsService.poll(5000).subscribe();
        }
      }),
      filter(metric => !!metric),
      tap(() => {
        // If we're polling to get metric then make sure to unsub
        if (this.fetchMetricsSub) {
          this.fetchMetricsSub.unsubscribe();
        }
      }),
      publishReplay(1),
      refCount()
    );

    const kubeEndpoint$: Observable<EntityInfo<EndpointModel>> =
      stratosEntityCatalog.endpoint.store.getEntityService(config.eiriniRelationship.guid).waitForEntity$.pipe(
        // Find the metrics endpoint that provides eirini (so must have kube)
        switchMap(metricsEndpoint => {
          // Find the kube endpoint that the metrics endpoint is connected to
          const kubeEndpoint = metricsEndpoint.entity.relations.provides.find(e => e.type === CfRelationTypes.METRICS_KUBE);
          return kubeEndpoint ?
            stratosEntityCatalog.endpoint.store.getEntityService(kubeEndpoint.guid).waitForEntity$ :
            of(null);
        })
      );

    const kubeEnabled$ = this.store.select(s => s.auth).pipe(
      // TODO: RC use of 'kubernetes'
      map((auth: AuthState) => auth.sessionData && auth.sessionData.plugins && auth.sessionData.plugins.kubernetes)
    );

    this.nodeUrl$ = kubeEnabled$.pipe(
      filter(kubeEnabled => kubeEnabled),
      switchMap(() => combineLatest([
        this.nodeName$,
        kubeEndpoint$
      ])),
      map(([kubeName, kubeEndpoint]) => kubeEndpoint ? `/kubernetes/${kubeEndpoint.entity.guid}/nodes/${kubeName}/summary` : null)
    );
  }

  constructor(private store: Store<AppState>) {
    super();
  }

  private getInstanceId(podName: string): string {
    return podName.slice(podName.lastIndexOf('-') + 1, podName.length);
  }

}
