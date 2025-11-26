import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  ListDataSource,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { GeneralEntityAppState } from '../../../../../../../store/src/app-state';
import type { IMetricMatrixResult, IMetrics } from '../../../../../../../store/src/types/base-metric.types';
import type { IMetricCell } from '../../../../../../../store/src/types/metric.types';
import type { FetchCFCellMetricsPaginatedAction } from '../../../../../actions/cf-metrics.actions';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export interface CfCellHealthEntry {
  timestamp: number;
  state: CfCellHealthState;
}

export enum CfCellHealthState {
  HEALTHY = 0,
  UNHEALTHY = 1,
  INITIAL_HEALTHY = 2,
  INITIAL_UNHEALTHY = 3,
}

export class CfCellHealthDataSource extends ListDataSource<CfCellHealthEntry, IMetrics<IMetricMatrixResult<IMetricCell>>> {

  static appIdPath = 'metric.application_id';

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<CfCellHealthEntry>,
    action: FetchCFCellMetricsPaginatedAction,
  ) {
    super({
      store,
      action,
      schema: cfEntityFactory(action.entityType),
      getRowUniqueId: (metrics: IMetrics<IMetricMatrixResult<IMetricCell>>) => {
        // For metrics objects, create a unique ID from the metric data
        if (metrics && Array.isArray(metrics) && metrics.length > 0 && metrics[0].data?.result?.[0]?.metric) {
          return metrics[0].data.result[0].metric.bosh_job_id || 'unknown';
        }
        return 'unknown';
      },
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntity: map((response) => {
        if (!response || !response[0] || !response[0].data.result[0] || !response[0].data.result[0].values) {
          return [];
        }
        return this.mapMetricsToStates(response[0].data.result[0].values);
      }),
      listConfig
    });
  }

  private mapMetricsToStates(values: [number, string][]): CfCellHealthEntry[] {
    // Create a new collection containing only the change of state
    const newValues = values.reduce((res, value, index) => {
      const timestamp = value[0];
      const state = value[1];
      if (index === 0) {
        // Record the first entry
        res.current = state;
        res.collection.push({
          timestamp,
          state: state === '0' ? CfCellHealthState.INITIAL_HEALTHY : CfCellHealthState.INITIAL_UNHEALTHY
        });
      } else if (res.current !== state) {
        // Record any change of state
        res.current = state;
        res.collection.push({
          timestamp,
          state: state === '0' ? CfCellHealthState.HEALTHY : CfCellHealthState.UNHEALTHY
        });
      }
      return res;
    }, { current: null as string | null, collection: [] as CfCellHealthEntry[] });

    return newValues.collection;
  }

}
