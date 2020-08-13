import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import { FetchCFCellMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfCellsDataSource
  extends ListDataSource<IMetricVectorResult<IMetricCell>, IMetrics<IMetricVectorResult<IMetricCell>>> {

  static cellIdPath = 'metric.bosh_job_id';
  static cellNamePath = 'metric.bosh_job_name';
  static cellHealthyPath = 'value.1';
  static cellDeploymentPath = 'metric.bosh_deployment';

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<IMetricVectorResult<IMetricCell>>,
    action: FetchCFCellMetricsPaginatedAction
  ) {
    super({
      store,
      action,
      schema: cfEntityFactory(action.entityType),
      getRowUniqueId: (row) => row.metric.bosh_job_id,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: CfCellsDataSource.cellIdPath }],
      transformEntity: map((response) => {
        if (!response || response.length === 0) {
          return [];
        }
        return response[0].data.result;
      }),
      listConfig
    });
  }
}
