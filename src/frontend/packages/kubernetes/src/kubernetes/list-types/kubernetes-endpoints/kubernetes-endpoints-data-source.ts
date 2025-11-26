import { Store } from '@ngrx/store';

import {
  BaseEndpointsDataSource,
  type IListConfig,
  syncPaginationSection
} from '@stratosui/core';
import { GetAllEndpoints } from '../../../../../store/src/actions/endpoint.actions';
import type { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import type { InternalEventMonitorFactory } from '../../../../../store/src/monitors/internal-event-monitor.factory';
import type { PaginationMonitorFactory } from '../../../../../store/src/monitors/pagination-monitor.factory';
import type { AppState, EndpointModel } from '../../../../../store/src/public-api';

export class KubernetesEndpointsDataSource extends BaseEndpointsDataSource {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'kube-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(
      store,
      listConfig,
      action,
      'k8s',
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
    );
  }

}
