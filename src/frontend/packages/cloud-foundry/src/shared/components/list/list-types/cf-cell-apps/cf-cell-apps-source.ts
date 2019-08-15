import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GetApplication } from '../../../../../../../cloud-foundry/src/actions/application.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  applicationEntityType,
  cfEntityFactory,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { IApp } from '../../../../../../../core/src/core/cf-api.types';
import { EntityServiceFactory } from '../../../../../../../core/src/core/entity-service-factory.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { MetricQueryType } from '../../../../../../../core/src/shared/services/metrics-range-selector.types';
import { FetchCFMetricsPaginatedAction, MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../../store/src/types/metric.types';
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
    entityServiceFactory: EntityServiceFactory
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
          appEntityService: this.createAppEntityService(res.metric.application_id, cfGuid, entityServiceFactory)
        }));
      }),
      listConfig
    });
    this.appEntityServices = {};
  }

  private createAppEntityService(
    appGuid: string,
    cfGuid: string,
    entityServiceFactory: EntityServiceFactory): Observable<APIResource<IApp>> {
    if (!this.appEntityServices[appGuid]) {
      this.appEntityServices[appGuid] = entityServiceFactory.create<APIResource<IApp>>(
        appGuid,
        new GetApplication(appGuid, cfGuid, [
          createEntityRelationKey(applicationEntityType, spaceEntityType),
          createEntityRelationKey(spaceEntityType, organizationEntityType)
        ]),
        true
      ).waitForEntity$.pipe(
        map(entityInfo => entityInfo.entity)
      );
    }
    return this.appEntityServices[appGuid];
  }
}
