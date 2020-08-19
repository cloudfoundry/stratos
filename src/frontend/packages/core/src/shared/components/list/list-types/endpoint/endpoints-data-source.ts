import { Store } from '@ngrx/store';

import { AppState } from '@stratosui/store';
import { EntityMonitorFactory } from '@stratosui/store';
import { InternalEventMonitorFactory } from '@stratosui/store';
import { PaginationMonitorFactory } from '@stratosui/store';
import { stratosEntityCatalog } from '@stratosui/store';
import { EndpointModel } from '@stratosui/store';
import { IListConfig } from '../../list.component.types';
import { BaseEndpointsDataSource } from './base-endpoints-data-source';


export class EndpointsDataSource extends BaseEndpointsDataSource {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    super(
      store,
      listConfig,
      stratosEntityCatalog.endpoint.actions.getAll(),
      null,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      false
    );
  }
}
