import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import {
  ListDataSource,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { GeneralEntityAppState } from '../../../../../../../store/src/app-state';
import type { IMetrics, IMetricVectorResult } from '../../../../../../../store/src/types/base-metric.types';
import type { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import type { FetchCFCellMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfCellsDataSource
  extends ListDataSource<IMetricVectorResult<IMetricCell>, IMetrics<IMetricVectorResult<IMetricCell>>> {

  static cellIdPath = 'metric.bosh_job_id';
  static cellNamePath = 'metric.bosh_job_name';
  static cellHealthyPath = 'value.1';
  static cellDeploymentPath = 'metric.bosh_deployment';

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<IMetricVectorResult<IMetricCell>>,
    action: FetchCFCellMetricsPaginatedAction
  ) {
    super({
      store,
      action,
      schema: cfEntityFactory(action.entityType),
      getRowUniqueId: (row: IMetrics<IMetricVectorResult<IMetricCell>>): string => {
        // For metrics objects, we need to extract the first result's bosh_job_id
        if (row && Array.isArray(row) && row.length > 0 && row[0].metric) {
          return row[0].metric.bosh_job_id;
        }
        return '';
      },
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: CfCellsDataSource.cellIdPath }],
      transformEntity: map((response): IMetricVectorResult<IMetricCell>[] => {
        if (!response || response.length === 0) {
          return [];
        }
        return response[0].data.result;
      }),
      listConfig
    });
  }
}
