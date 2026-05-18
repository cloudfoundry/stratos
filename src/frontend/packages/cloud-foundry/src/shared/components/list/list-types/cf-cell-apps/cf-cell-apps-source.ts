import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication, MetricQueryType } from '../../../../../../../store/src/types/metric.types';
import { FetchCFMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { StApp } from '../../../../../services/endpoint-data/stratos-types';

export interface CfCellApp {
  metric: IMetricApplication;
  appGuid: string;
  // Native Stratos app shape (spaceName / spaceGuid / orgName / orgGuid
  // stitched server-side by getNativeAppDetail's default path). The
  // legacy V2 APIResource<IApp> wrapper is gone — column cellDefinitions
  // read native flat fields directly.
  app$: Observable<StApp | null>;
}

export class CfCellAppsDataSource
  extends ListDataSource<CfCellApp, IMetrics<IMetricVectorResult<IMetricApplication>>> {

  static appIdPath = 'metric.application_id';
  private appCache: { [appGuid: string]: Observable<StApp | null> };

  constructor(
    store: Store<CFAppState>,
    http: HttpClient,
    cfGuid: string,
    cellId: string,
    listConfig: IListConfig<CfCellApp>,
  ) {
    const action = new FetchCFMetricsPaginatedAction(
      cellId,
      cfGuid,
      new MetricQueryConfig(`firehose_container_metric_cpu_percentage{bosh_job_id="${cellId}"}`),
      MetricQueryType.QUERY
    );

    super({
      store,
      action,
      schema: cfEntityFactory(action.entityType),
      getRowUniqueId: (row: IMetrics<IMetricVectorResult<IMetricApplication>>) => {
        if (row && Array.isArray(row) && row.length > 0 && row[0]?.data?.result?.[0]?.metric?.application_id) {
          return row[0].data.result[0].metric.application_id;
        }
        return 'unknown';
      },
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntity: map((response) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response[0].data.result.map(res => ({
          metric: res.metric,
          appGuid: res.metric.application_id,
          app$: this.fetchApp(http, res.metric.application_id, cfGuid),
        }));
      }),
      listConfig
    });
    this.getRowUniqueId = (row: CfCellApp) => row.appGuid;
    this.appCache = {};
  }

  private fetchApp(http: HttpClient, appGuid: string, cfGuid: string): Observable<StApp | null> {
    if (!this.appCache[appGuid]) {
      this.appCache[appGuid] = http.get<StApp>(`/pp/v1/cf/apps/${cfGuid}/${appGuid}`).pipe(
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.appCache[appGuid];
  }
}
