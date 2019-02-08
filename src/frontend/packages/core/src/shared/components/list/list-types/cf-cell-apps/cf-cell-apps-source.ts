import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IApp } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { MetricQueryType } from '../../../../services/metrics-range-selector.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { IMetricApplication } from '../../../../../../../store/src/types/metric.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { FetchCFMetricsPaginatedAction, MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import {
  applicationSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetApplication } from '../../../../../../../store/src/actions/application.actions';
import { createEntityRelationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';

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
    store: Store<AppState>,
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
      schema: entityFactory(action.entityKey),
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
        applicationSchemaKey,
        entityFactory(applicationSchemaKey),
        appGuid,
        new GetApplication(appGuid, cfGuid, [
          createEntityRelationKey(applicationSchemaKey, spaceSchemaKey),
          createEntityRelationKey(spaceSchemaKey, organizationSchemaKey)
        ]),
        true
      ).waitForEntity$.pipe(
        map(entityInfo => entityInfo.entity)
      );
    }
    return this.appEntityServices[appGuid];
  }
}
