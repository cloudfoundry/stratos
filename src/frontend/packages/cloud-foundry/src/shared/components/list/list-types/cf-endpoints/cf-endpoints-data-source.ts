import { Store } from '@ngrx/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  BaseEndpointsDataSource,
  syncPaginationSection,
  type IListConfig,
} from '@stratosui/core';
import type { GeneralEntityAppState } from '../../../../../../../store/src/app-state';
import type { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import type { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import type { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import type { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';

export class CFEndpointsDataSource extends BaseEndpointsDataSource {
  declare store: Store<GeneralEntityAppState>;

  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    const action = stratosEntityCatalog.endpoint.actions.getAll();
    const paginationKey = 'cf-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(store, listConfig, action, 'cf', paginationMonitorFactory, entityMonitorFactory, internalEventMonitorFactory);
  }
}
