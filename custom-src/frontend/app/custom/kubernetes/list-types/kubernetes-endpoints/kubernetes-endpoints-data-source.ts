import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../../store/src/actions/endpoint.actions';
import { CreatePagination } from '../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { BaseEndpointsDataSource } from '../../../../shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';
import { EntityMonitorFactory } from '../../../../shared/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../shared/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';


export class KubernetesEndpointsDataSource extends BaseEndpointsDataSource {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'k8s-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    store.dispatch(new CreatePagination(
      action.entityKey,
      paginationKey,
      action.paginationKey
    ));
    action.paginationKey = paginationKey;
    super(store, listConfig, action, 'k8s', paginationMonitorFactory, entityMonitorFactory, internalEventMonitorFactory);
  }
}
