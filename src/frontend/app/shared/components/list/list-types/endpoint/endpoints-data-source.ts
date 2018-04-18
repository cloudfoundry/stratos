import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { ListRowSateHelper } from './endpoint-data-source.helpers';
import { GetSystemInfo } from '../../../../../store/actions/system.actions';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { tap, pairwise } from 'rxjs/operators';


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
      GetAllEndpoints.storeKey
    );
    const eventMonitor = internalEventMonitorFactory.getMonitor(endpointSchemaKey);
    const eventSub = eventMonitor.hasErroredOverTime().pipe(
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
        metricsAvailable: false
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
}
