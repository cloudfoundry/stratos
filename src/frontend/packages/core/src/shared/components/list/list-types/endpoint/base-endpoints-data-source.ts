import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, pairwise, tap, withLatestFrom } from 'rxjs/operators';

import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { CreatePagination } from '../../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { endpointEntityType } from '../../../../../../../store/src/helpers/stratos-entity-factory';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { endpointEntitiesSelector } from '../../../../../../../store/src/selectors/endpoint.selectors';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
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
    action.paginationKey
  ));
}

export class BaseEndpointsDataSource extends ListDataSource<EndpointModel> {
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
    onlyConnected = true
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

    super({
      ...config,
      paginationKey: action.paginationKey,
      transformEntities: [
        (entities: EndpointModel[]) => {
          return dsEndpointType || onlyConnected ? entities.filter(endpoint => {
            return (!onlyConnected || endpoint.connectionStatus === 'connected') &&
              (!dsEndpointType || endpoint.cnsi_type === dsEndpointType);
          }) : entities;
        },
        {
          type: 'filter',
          field: 'name'
        },
      ],
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
}
