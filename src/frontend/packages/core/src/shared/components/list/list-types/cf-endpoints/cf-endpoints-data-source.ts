import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { IListConfig } from '../../list.component.types';
import { BaseEndpointsDataSource, syncPaginationSection } from '../endpoint/base-endpoints-data-source';

export class CFEndpointsDataSource extends BaseEndpointsDataSource {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'cf-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(store, listConfig, action, 'cf', paginationMonitorFactory, entityMonitorFactory, internalEventMonitorFactory);
  }
}
