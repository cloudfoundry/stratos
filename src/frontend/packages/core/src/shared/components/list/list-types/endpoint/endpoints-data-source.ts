import { Injector } from '@angular/core';
import {
  AppState,
  EndpointModel,
  EndpointsDataService,
  EntityMonitorFactory,
  InternalEventMonitorFactory,
  PaginationMonitorFactory,
  Store,
} from '@stratosui/store';

import { IListConfig } from '../../list.component.types';
import { BaseEndpointsDataSource, EndpointsListAction } from './base-endpoints-data-source';

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
      new EndpointsListAction(),
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
