import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../../store/src/actions/endpoint.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { EntityMonitorFactory } from '../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import {
  BaseEndpointsDataSource,
  syncPaginationSection,
} from '../../../../shared/components/list/list-types/endpoint/base-endpoints-data-source';
import { IListConfig } from '../../../../shared/components/list/list.component.types';

export class KubernetesEndpointsDataSource extends BaseEndpointsDataSource {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'kube-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super(
      store,
      listConfig,
      action,
      'k8s',
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory
    );
  }

}
