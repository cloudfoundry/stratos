import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { FetchCFCellMetricsPaginatedAction, MetricQueryConfig } from '../../../../store/src/actions/metrics.actions';
import { AppState } from '../../../../store/src/app-state';
import { entityFactory } from '../../../../store/src/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { IMetrics } from '../../../../store/src/types/base-metric.types';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { MetricQueryType } from '../../shared/services/metrics-range-selector.types';
import { endpointHasMetricsByAvailable } from '../endpoints/endpoint-helpers';
import { CellMetrics } from './tabs/cloud-foundry-cells/cloud-foundry-cell/cloud-foundry-cell.service';

export class CfCellHelper {

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory) {
  }

  public createCellMetricAction(cfId: string, cellId?: string): Observable<FetchCFCellMetricsPaginatedAction> {
    const cellIdString = !!cellId ? `{bosh_job_id="${cellId}"}` : '';

    const newMetricAction: FetchCFCellMetricsPaginatedAction = new FetchCFCellMetricsPaginatedAction(
      cfId,
      cfId,
      new MetricQueryConfig(CellMetrics.HEALTHY + cellIdString, {}),
      MetricQueryType.QUERY
    );
    return this.hasMetric(newMetricAction).pipe(
      switchMap(hasNewMetric => hasNewMetric ?
        of(hasNewMetric) :
        this.hasMetric(new FetchCFCellMetricsPaginatedAction(
          cfId,
          cfId,
          new MetricQueryConfig(CellMetrics.HEALTHY_DEP + cellIdString, {}),
          MetricQueryType.QUERY
        ))
      )
    );
  }

  private hasMetric(action: FetchCFCellMetricsPaginatedAction): Observable<FetchCFCellMetricsPaginatedAction> {
    return getPaginationObservables<IMetrics>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        action.paginationKey,
        entityFactory(action.entityKey)
      )
    }).entities$.pipe(
      filter(entities => !!entities && !!entities.length),
      first(),
      map(entities => !!entities.find(entity => !!entity.data.result.length) ? action : null),
      publishReplay(1),
      refCount()
    );
  }

  public hasCellMetrics(endpointId: string): Observable<boolean> {
    return endpointHasMetricsByAvailable(this.store, endpointId).pipe(
      // If metrics set up for this endpoint check if we can fetch cell metrics from it.
      // If the metric is unknown an empty list is returned
      switchMap(hasMetrics => hasMetrics ? this.createCellMetricAction(endpointId).pipe(map(action => !!action)) : of(false))
    );
  }
}
