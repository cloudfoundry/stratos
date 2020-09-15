import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication, MetricQueryType } from '../../../../../../../store/src/types/metric.types';
import { FetchCFMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import { IApp } from '../../../../../cf-api.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { createEntityRelationKey } from '../../../../../entity-relations/entity-relations.types';

export interface CfCellApp {
  metric: IMetricApplication;
  appGuid: string;
  appEntityService: Observable<APIResource<IApp>>;
}

export class CfCellAppsDataSource
  extends ListDataSource<CfCellApp, IMetrics<IMetricVectorResult<IMetricApplication>>> {

  static appIdPath = 'metric.application_id';
  private appEntityServices: { [appGuid: string]: Observable<APIResource<IApp>> };

  constructor(
    store: Store<CFAppState>,
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
      getRowUniqueId: (row: CfCellApp) => row.appGuid,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntity: map((response) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response[0].data.result.map(res => ({
          metric: res.metric,
          appGuid: res.metric.application_id,
          appEntityService: this.createAppEntityService(res.metric.application_id, cfGuid)
        }));
      }),
      listConfig
    });
    this.appEntityServices = {};
  }

  private createAppEntityService(
    appGuid: string,
    cfGuid: string
  ): Observable<APIResource<IApp>> {
    if (!this.appEntityServices[appGuid]) {
      this.appEntityServices[appGuid] = cfEntityCatalog.application.store.getEntityService(
        appGuid,
        cfGuid, {
        includeRelations: [
          createEntityRelationKey(applicationEntityType, spaceEntityType),
          createEntityRelationKey(spaceEntityType, organizationEntityType)
        ],
        populateMissing: true
      }
      ).waitForEntity$.pipe(
        map(entityInfo => entityInfo.entity)
      );
    }
    return this.appEntityServices[appGuid];
  }
}
