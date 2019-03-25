import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
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
      new GetAllEndpoints(),
      null,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory
    );
  }
}
