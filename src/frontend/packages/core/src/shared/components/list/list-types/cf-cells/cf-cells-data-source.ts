import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import { FetchCFCellMetricsPaginatedAction } from '../../../../../../../store/src/actions/metrics.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfCellsDataSource
  extends ListDataSource<IMetricVectorResult<IMetricCell>, IMetrics<IMetricVectorResult<IMetricCell>>> {

  static cellIdPath = 'metric.bosh_job_id';
  static cellNamePath = 'metric.bosh_job_name';
  static cellHealthyPath = 'value.1';
  static cellDeploymentPath = 'metric.bosh_deployment';

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<IMetricVectorResult<IMetricCell>>,
    action: FetchCFCellMetricsPaginatedAction
  ) {
    super({
      store,
      action,
      schema: entityFactory(action.entityKey),
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
