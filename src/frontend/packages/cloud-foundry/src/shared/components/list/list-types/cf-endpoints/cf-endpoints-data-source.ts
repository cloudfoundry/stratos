import { Injector } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  BaseEndpointsDataSource,
  EndpointsListAction,
  syncPaginationSection,
} from '../../../../../../../core/src/shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
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
    const paginationKey = 'cf-endpoints';
    const action = new EndpointsListAction(paginationKey);
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    super(store, listConfig, action, 'cf', paginationMonitorFactory, entityMonitorFactory, internalEventMonitorFactory, endpointsService, injector);
  }
}
