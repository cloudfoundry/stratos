import { Injector } from '@angular/core';
import {
  AppState,
  EndpointModel,
  EndpointsDataService,
  EntityMonitorFactory,
  GetAllEndpoints,
  InternalEventMonitorFactory,
  PaginationMonitorFactory,
  Store,
} from '@stratosui/store';

import { IListConfig } from '../../list.component.types';
import { BaseEndpointsDataSource } from './base-endpoints-data-source';

export class EndpointsDataSource extends BaseEndpointsDataSource {
  declare store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointsService: EndpointsDataService,
    injector: Injector,
    filterByType = false
  ) {
    super(
      store,
      listConfig,
      // W36-B Wave 3: construct the legacy `GetAllEndpoints` action
      // directly rather than going through the entity-catalog
      // dispatcher. The action class survives until Wave 5; this just
      // decouples the data source from the catalog indirection. The
      // BaseEndpointsDataSource still uses the action object for its
      // pagination key + refresh dispatch — that ngrx pagination
      // pipeline is unchanged in this wave.
      new GetAllEndpoints(),
      null,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      endpointsService,
      injector,
      false,
      filterByType
    );
  }
}
