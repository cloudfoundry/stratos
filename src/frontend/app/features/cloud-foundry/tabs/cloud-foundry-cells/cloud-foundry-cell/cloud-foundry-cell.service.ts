import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { FetchCFMetricsAction, MetricQueryConfig, MetricQueryType } from '../../../../../store/actions/metrics.actions';
import { entityFactory, metricSchemaKey } from '../../../../../store/helpers/entity-factory';
import { IMetrics, IMetricVectorResult } from '../../../../../store/types/base-metric.types';
import { IMetricCell } from '../../../../../store/types/metric.types';
import { ActiveRouteCfCell } from '../../../cf-page.types';

@Injectable()
export class CloudFoundryCellService {

  cfGuid: string;
  cellId: string;
  healthyAction: FetchCFMetricsAction;
  healthy$: Observable<IMetrics<IMetricVectorResult<IMetricCell>>>;

  constructor(
    activeRouteCfCell: ActiveRouteCfCell,
    entityServiceFactory: EntityServiceFactory) {

    this.cellId = activeRouteCfCell.cellId;
    this.cfGuid = activeRouteCfCell.cfGuid;

    // TODO: RC limit by cell
    this.healthyAction = new FetchCFMetricsAction(
      this.cfGuid,
      new MetricQueryConfig('firehose_value_metric_rep_unhealthy_cell', {}),
      MetricQueryType.QUERY
    );
    this.healthy$ = entityServiceFactory.create<IMetrics<IMetricVectorResult<IMetricCell>>>(
      metricSchemaKey,
      entityFactory(metricSchemaKey),
      this.healthyAction.metricId,
      this.healthyAction,
      false
    ).waitForEntity$.pipe(
      map(entityInfo => entityInfo.entity)
    );
  }


}
