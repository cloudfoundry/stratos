import { Component, Input } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { EntityService } from '../../../../../../../../store/src/entity-service';
import { IMetricMatrixResult, IMetrics } from '../../../../../../../../store/src/types/base-metric.types';
import { ListAppInstance } from '../app-instance-types';

@Component({
  selector: 'app-table-cell-kube-node',
  templateUrl: './table-cell-kube-node.component.html',
  styleUrls: ['./table-cell-kube-node.component.scss']
})
export class TableCellKubeNodeComponent extends TableCellCustom<ListAppInstance> {

  nodeName$: Observable<string>;
  private fetchMetricsSub: Subscription;

  @Input('config')
  set config(config: {
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
      })
    );
  }

  constructor() {
    super();
  }

  private getInstanceId(podName: string): string {
    return podName.slice(podName.lastIndexOf('-') + 1, podName.length);
  }

}
