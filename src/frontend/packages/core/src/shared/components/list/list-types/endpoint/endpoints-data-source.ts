import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
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
