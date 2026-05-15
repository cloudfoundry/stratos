import { Injector } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  BaseEndpointsDataSource,
  syncPaginationSection,
} from '../../../../../../../core/src/shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { EndpointsDataService } from '../../../../../../../store/src/services/endpoints-data.service';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';

export class CFEndpointsDataSource extends BaseEndpointsDataSource {
  declare store: Store<CFAppState>;

  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointsService: EndpointsDataService,
    injector: Injector
  ) {
    // W36-B Wave 3: construct the legacy `GetAllEndpoints` action
    // directly. See cf-endpoints-data-source for full rationale —
    // BaseEndpointsDataSource still uses the action's pagination key
    // + refresh dispatch path; this just removes the catalog
    // indirection without touching that pipeline.
    const action = new GetAllEndpoints();
    const paginationKey = 'cf-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(store, listConfig, action, 'cf', paginationMonitorFactory, entityMonitorFactory, internalEventMonitorFactory, endpointsService, injector);
  }
}
