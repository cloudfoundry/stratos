import {
  AppState,
  CreatePagination,
  EndpointModel,
  EndpointsDataService,
  endpointEntityType,
  EntityMonitorFactory,
  EntityRequestAction,
  InternalEventMonitorFactory,
  PaginationEntityState,
  PaginationMonitorFactory,
  STRATOS_ENDPOINT_TYPE,
  stratosEntityFactory,
  Store,
} from '@stratosui/store';
import { toObservable } from '@angular/core/rxjs-interop';
import { Injector, runInInjectionContext } from '@angular/core';
import { Observable } from 'rxjs';
import { map, pairwise, tap, withLatestFrom } from 'rxjs/operators';

import { DataFunction, DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListDataSourceConfig } from '../../data-sources-controllers/list-data-source-config';
import { RowsState } from '../../data-sources-controllers/list-data-source-types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';
import { ListRowSateHelper } from '../../list.helper';
import { EndpointRowStateSetUpManager } from '../endpoint/endpoint-data-source.helpers';

/**
 * Wave 5 (W36-B/C): the legacy `GetAllEndpoints` ngrx action class is
 * gone, and the schema-only `stratos`/`endpoint` catalog entry that
 * previously served lookups for this data source has been retired too.
 * `BaseEndpointsDataSource` still feeds the legacy client-side
 * pagination machinery, which keys off `EntityRequestAction` shape
 * (entityType, endpointType, schema, paginationKey, initialParams).
 *
 * `EndpointsListAction` is the value-only stand-in: never dispatched
 * (refresh now calls `EndpointsDataService.getAll()` directly), just
 * used to seed the pagination row. The schema lives on the action
 * itself (`entity[0]`) — no catalog round-trip needed.
 */
export class EndpointsListAction implements EntityRequestAction {
  public type = '[Endpoints] List';
  public entityType = endpointEntityType;
  public endpointType = STRATOS_ENDPOINT_TYPE;
  public entity = [stratosEntityFactory(endpointEntityType)];
  constructor(public paginationKey: string = 'endpoint-list') { }
  initialParams = {
    'order-direction': 'desc',
    'order-direction-field': 'name',
    page: 1,
    'results-per-page': 50,
  };
}

export function syncPaginationSection(
  store: Store<AppState>,
  action: EndpointsListAction,
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

  declare store: Store<AppState>;
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
    action: EndpointsListAction,
    dsEndpointType: string = null,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointsService: EndpointsDataService,
    injector: Injector,
    onlyConnected = true,
    filterByType = false
  ) {
    const rowStateHelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      action.paginationKey,
      action,
      (paginationMonitor, entityMonitorFactoryArg, rowStateManagerArg) =>
        EndpointRowStateSetUpManager(
          paginationMonitor,
          entityMonitorFactoryArg,
          rowStateManagerArg,
          endpointsService,
          injector,
        ),
      false
    );
    const eventSub = BaseEndpointsDataSource.monitorEvents(internalEventMonitorFactory, rowStateManager, endpointsService, injector);
    const config = BaseEndpointsDataSource.getEndpointConfig(
      store,
      action,
      listConfig,
      rowStateManager.observable,
      () => {
        eventSub.unsubscribe();
        sub.unsubscribe();
      },
      () => { void endpointsService.getAll(false); }
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
    action: EndpointsListAction,
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
    endpointsService: EndpointsDataService,
    injector: Injector
  ) {
    const eventMonitor = internalEventMonitorFactory.getMonitor(endpointEntityType);
    // Wave 2 (W36-B): bridge `endpointsService.endpoints` signal to an
    // observable so the `withLatestFrom` rxjs pipeline keeps working.
    // `toObservable` requires an injection context, hence the
    // `runInInjectionContext` wrap.
    const endpoints$ = runInInjectionContext(injector, () =>
      toObservable(endpointsService.endpoints)
    );
    return eventMonitor.hasErroredOverTime().pipe(
      withLatestFrom(endpoints$),
      tap(([errored, endpoints]) => Object.keys(errored).forEach(id => {
        const endpoint = endpoints.get(id);
        if (endpoint && endpoint.connectionStatus === 'connected') {
          rowStateManager.updateRowState(id, {
            error: true,
            message: `We've been having trouble communicating with this endpoint`
          });
        }
      }
      )),
      map(([errored]) => errored),
      pairwise(),
      tap(([oldErrored, newErrored]) => {
        if (oldErrored) {
          Object.keys(oldErrored).forEach(oldId => {
            if (newErrored && !Object.keys(newErrored).find(newId => newId === oldId)) {
              rowStateManager.updateRowState(oldId, {
                error: false,
                message: ''
              });
            }
          });
        }
      })
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
