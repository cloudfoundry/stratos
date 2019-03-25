import { Store } from '@ngrx/store';
import { map, pairwise, tap, withLatestFrom } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { GetSystemInfo } from '../../../../../../../store/src/actions/system.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { endpointEntitiesSelector } from '../../../../../../../store/src/selectors/endpoint.selectors';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';
import { ListRowSateHelper } from '../../list.helper';
import { EndpointRowStateSetUpManager } from '../endpoint/endpoint-data-source.helpers';


export abstract class BaseEndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;
  endpointType: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    action: GetAllEndpoints,
    endpointType: string = null,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory
  ) {
    const rowStateHelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      GetAllEndpoints.storeKey,
      endpointSchemaKey,
      EndpointRowStateSetUpManager
    );
    const eventSub = BaseEndpointsDataSource.monitorEvents(internalEventMonitorFactory, rowStateManager, store);
    const config = BaseEndpointsDataSource.getEndpointConfig(
      store,
      action,
      listConfig,
      rowStateManager.observable,
      () => {
        eventSub.unsubscribe();
        sub.unsubscribe();
      },
      () => this.store.dispatch(action)
    );

    super({
      ...config,
      paginationKey: action.paginationKey,
      transformEntities: [
        (entities: EndpointModel[]) => {
          return endpointType ? entities.filter(endpoint => {
            return endpoint.connectionStatus === 'connected' && endpoint.cnsi_type === endpointType;
          }) : entities;
        },
        {
          type: 'filter',
          field: 'name'
        },
      ],
      refresh: () => this.store.dispatch(new GetSystemInfo(false, action)),
    });
    this.endpointType = endpointType;
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
  static monitorEvents(
    internalEventMonitorFactory: InternalEventMonitorFactory,
    rowStateManager: TableRowStateManager,
    store: Store<AppState>
  ) {
    const eventMonitor = internalEventMonitorFactory.getMonitor(endpointSchemaKey);
    return eventMonitor.hasErroredOverTime().pipe(
      withLatestFrom(store.select(endpointEntitiesSelector)),
      tap(([errored, endpoints]) => errored.forEach(id => {
        if (endpoints[id].connectionStatus === 'connected') {
          rowStateManager.updateRowState(id, {
            error: true,
            message: `We've been having trouble communicating with this endpoint`
          });
        }
      }
      )),
      map(([errored]) => errored),
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
