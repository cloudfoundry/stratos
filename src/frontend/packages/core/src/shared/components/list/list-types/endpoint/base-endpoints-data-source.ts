import { Store } from '@ngrx/store';
import {
  PaginationMonitorFactory,
  GetAllEndpoints,
  AppState,
  InternalEventMonitorFactory,
  EndpointModel,
  PaginationEntityState,
  CreatePagination,
  endpointEntityType,
  EntityMonitorFactory,
  endpointEntitiesSelector,
} from '@stratosui/store';
import { Observable } from 'rxjs';
import { map, pairwise, tap, withLatestFrom } from 'rxjs/operators';

import { DataFunction, DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListDataSourceConfig } from '../../data-sources-controllers/list-data-source-config';
import { RowsState } from '../../data-sources-controllers/list-data-source-types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';
import { ListRowSateHelper } from '../../list.helper';
import { EndpointRowStateSetUpManager } from '../endpoint/endpoint-data-source.helpers';

export function syncPaginationSection(
  store: Store<AppState>,
  action: GetAllEndpoints,
  paginationKey: string
) {
  store.dispatch(new CreatePagination(
    action,
    paginationKey,
    action.paginationKey,
    action.initialParams
  ));
}

export class BaseEndpointsDataSource extends ListDataSource<EndpointModel> {

  public static typeFilterKey = 'endpointType';

  store: Store<AppState>;
  /**
   * Used to distinguish between data sources providing all endpoints or those that only provide endpoints matching this value.
   * Value should match those of an endpoint's `cnsi_type`.
   *
   * Note - Should not be renamed to endpointType to avoid clash with ListDataSource endpointType
   */
  dsEndpointType: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    action: GetAllEndpoints,
    dsEndpointType: string = null,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    onlyConnected = true,
    filterByType = false
  ) {
    const rowStateHelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      action.paginationKey,
      action,
      EndpointRowStateSetUpManager,
      false
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

    const transformEntities: (DataFunctionDefinition | DataFunction<EndpointModel>)[] = [{
      type: 'filter',
      field: 'name'
    }];
    if (dsEndpointType || onlyConnected) {
      transformEntities.push((entities: EndpointModel[]) => {
        return dsEndpointType || onlyConnected ? entities.filter(endpoint => {
          return (!onlyConnected || endpoint.connectionStatus === 'connected') &&
            (!dsEndpointType || endpoint.cnsi_type === dsEndpointType);
        }) : entities;
      });
    }
    if (filterByType) {
      transformEntities.push((entities: EndpointModel[], paginationState: PaginationEntityState) =>
        BaseEndpointsDataSource.endpointTypeFilter(entities, paginationState)
      );
    }

    super({
      ...config,
      paginationKey: action.paginationKey,
      transformEntities,
    });
    this.dsEndpointType = dsEndpointType;
  }

  static getEndpointConfig(
    store: Store<AppState>,
    action: GetAllEndpoints,
    listConfig: IListConfig<EndpointModel>,
    rowsState: Observable<RowsState>,
    destroy: () => void,
    refresh: () => void
  ): IListDataSourceConfig<EndpointModel, EndpointModel> {
    return {
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (object) => action.entity[0].getId(object),
      getEmptyType: () => ({
        name: '',
        system_shared_token: false,
        metricsAvailable: false,
        sso_allowed: false,
        creator: {
          name: '',
          admin: false,
          system: false
        }
      }),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
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
    const eventMonitor = internalEventMonitorFactory.getMonitor(endpointEntityType);
    return eventMonitor.hasErroredOverTime().pipe(
      withLatestFrom(store.select(endpointEntitiesSelector)),
      tap(([errored, endpoints]) => Object.keys(errored).forEach(id => {
        if (endpoints[id] && endpoints[id].connectionStatus === 'connected') {
          rowStateManager.updateRowState(id, {
            error: true,
            message: `We've been having trouble communicating with this endpoint`
          });
        }
      }
      )),
      map(([errored]) => errored),
      pairwise(),
      tap(([oldErrored, newErrored]) => Object.keys(oldErrored).forEach(oldId => {
        if (!Object.keys(newErrored).find(newId => newId === oldId)) {
          rowStateManager.updateRowState(oldId, {
            error: false,
            message: ''
          });
        }
      })),
    ).subscribe();
  }

  static endpointTypeFilter: DataFunction<EndpointModel> = (entities: EndpointModel[], paginationState: PaginationEntityState) => {
    if (
      !paginationState.clientPagination ||
      !paginationState.clientPagination.filter ||
      !paginationState.clientPagination.filter.items[BaseEndpointsDataSource.typeFilterKey]
    ) {
      return entities;
    }
    const searchTerm = paginationState.clientPagination.filter.items[BaseEndpointsDataSource.typeFilterKey];
    return searchTerm ?
      entities.filter(endpoint => endpoint.cnsi_type === searchTerm) :
      entities;
  };
}
