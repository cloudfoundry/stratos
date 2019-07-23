import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { IListConfig } from '../../list.component.types';
import { BaseEndpointsDataSource } from './base-endpoints-data-source';


export class EndpointsDataSource extends BaseEndpointsDataSource {
  store: Store<CFAppState>;

  constructor(
    store: Store<CFAppState>,
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
      internalEventMonitorFactory,
      false
    );
  }
}
