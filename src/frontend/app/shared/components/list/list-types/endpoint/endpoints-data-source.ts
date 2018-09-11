import { Store } from '@ngrx/store';
import { pairwise, tap } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { GetSystemInfo } from '../../../../../store/actions/system.actions';
import { AppState } from '../../../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';
import { ListRowSateHelper } from '../../list.helper';
import { EndpointRowStateSetUpManager } from './endpoint-data-source.helpers';


export class EndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    const action = new GetAllEndpoints();
    const rowStateHelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      GetAllEndpoints.storeKey,
      endpointSchemaKey,
      EndpointRowStateSetUpManager
    );
    const eventSub = EndpointsDataSource.monitorEvents(internalEventMonitorFactory, rowStateManager);
    const config = EndpointsDataSource.getEndpointConfig(
      store,
      action,
      listConfig,
      rowStateManager.observable,
      () => {
        eventSub.unsubscribe();
        sub.unsubscribe();
      },
      () => this.store.dispatch(new GetSystemInfo())
    );
    super(config);
  }
  static getEndpointConfig(
    store,
    action,
    listConfig,
    rowsState,
    destroy,
    refresh
  ) {
    return {
      store,
      action,
      schema: entityFactory(endpointSchemaKey),
      getRowUniqueId: object => object.guid,
      getEmptyType: () => ({
        name: '',
        system_shared_token: false,
        metricsAvailable: false,
        sso_allowed: false,
      }),
      paginationKey: GetAllEndpoints.storeKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ] as DataFunctionDefinition[],
      listConfig,
      rowsState,
      destroy,
      refresh
    };
  }
  static monitorEvents(internalEventMonitorFactory: InternalEventMonitorFactory, rowStateManager: TableRowStateManager) {
    const eventMonitor = internalEventMonitorFactory.getMonitor(endpointSchemaKey);
    return eventMonitor.hasErroredOverTime().pipe(
      tap(errored => errored.forEach(id => rowStateManager.updateRowState(id, {
        error: true,
        message: `We've been having trouble communicating with this endpoint`
      }))),
      pairwise(),
      tap(([oldErrored, newErrored]) => oldErrored.forEach(oldId => {
        if (!newErrored.find(newId => newId === oldId)) {
          rowStateManager.updateRowState(oldId, {
            error: false,
            message: ''
          });
        }
      })),
    ).subscribe();
  }
}
