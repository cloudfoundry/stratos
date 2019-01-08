import { Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { IRoute } from '../../../../../core/cf-api.types';
import { safeUnsubscribe } from '../../../../../core/utils.service';
import { getRoute, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { cfOrgSpaceFilter, getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, routeSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginatedAction, PaginationParam } from '../../../../../store/types/pagination.types';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListPaginationMultiFilterChange, RowsState } from '../../data-sources-controllers/list-data-source-types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../list.component.types';

export interface ListCfRoute extends IRoute {
  url: string;
  isTCPRoute: boolean;
  mappedAppsCount?: number;
  mappedAppsCountLabel?: string;
}

export abstract class CfRoutesDataSourceBase extends ListDataSource<APIResource<ListCfRoute>, APIResource<IRoute>> {

  cfGuid: string;
  appGuid: string;

  /**
   *Creates an instance of CfRoutesDataSourceBase.
   * @param {string} [appGuid]
   * Are the routes specific to a single app?
   * @param {boolean} [genericRouteState=true]
   * Use the generic route state which enables the route busy ux
   * @memberof CfRoutesDataSourceBase
   */
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource>,
    cfGuid: string,
    action: PaginatedAction,
    isLocal: boolean,
    appGuid?: string,
    genericRouteState = true
  ) {
    const { rowsState, sub } = CfRoutesDataSourceBase.createRowState(store, action.paginationKey, genericRouteState);

    super({
      store,
      action,
      schema: entityFactory(routeSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal,
      listConfig,
      rowsState,
      destroy: () => safeUnsubscribe(sub),
      transformEntities: [{ type: 'filter', field: 'entity.url' }, cfOrgSpaceFilter],
      transformEntity: map(routes => {
        // Supplement route object with additional fields. This allows better sorting and searching
        if (!routes || routes.length === 0) {
          return [];
        }
        return routes.map(route => {
          if (route.entity['url'] && route.entity['isTCPRoute']) {
            return route as APIResource<ListCfRoute>;
          }
          const entity: ListCfRoute = {
            ...route.entity,
            url: getRoute(route.entity.port, route.entity.host, route.entity.path, true, false, route.entity.domain.entity.name),
            isTCPRoute: isTCPRoute(route.entity.port)
          };

          if (appGuid && route.entity.apps) {
            const apps = route.entity.apps;
            const foundApp = !!apps && (apps.findIndex(a => a.metadata.guid === appGuid) >= 0);
            entity.mappedAppsCount = foundApp ? Number.MAX_SAFE_INTEGER : (route.entity.apps || []).length;
            entity.mappedAppsCountLabel = foundApp ? `Already attached` : entity.mappedAppsCount.toString();
          }

          return {
            ...route,
            entity
          };
        });
      })
    });
    this.cfGuid = cfGuid;
    this.appGuid = appGuid;

    this.setMultiFilter = (changes: ListPaginationMultiFilterChange[], params: PaginationParam) => {
      return createCfOrSpaceMultipleFilterFn(store, action, this.setQParam)
        (changes, params);
    };
  }

  /**
   * Create a row state manager that will set the route row state to busy/blocked/deleting etc
   * @private
   * @static
   * @param store
   * @param paginationKey
   * @param {boolean} genericRouteState
   * @returns {{ rowsState: Observable<RowsState>, sub: Subscription }}
   * @memberof CfRoutesDataSourceBase
   */
  private static createRowState(store, paginationKey, genericRouteState: boolean): { rowsState: Observable<RowsState>, sub: Subscription } {
    if (genericRouteState) {
      const { rowStateManager, sub } = CfRoutesDataSourceBase.getRowStateManager(store, paginationKey);
      return {
        rowsState: rowStateManager.observable,
        sub
      };
    } else {
      return {
        rowsState: null,
        sub: null
      };
    }
  }

  private static getRowStateManager(store: Store<AppState>, paginationKey: string): {
    rowStateManager: TableRowStateManager,
    sub: Subscription
  } {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = new PaginationMonitor(
      store,
      paginationKey,
      entityFactory(routeSchemaKey)
    );

    const sub = this.setUpManager(
      store,
      paginationMonitor,
      rowStateManager
    );
    return {
      rowStateManager,
      sub
    };
  }

  // This pattern might be worth pulling out into a more general helper if we use it again.
  private static setUpManager(
    store: Store<AppState>,
    paginationMonitor: PaginationMonitor<APIResource>,
    rowStateManager: TableRowStateManager
  ) {
    return paginationMonitor.currentPage$.pipe(
      map(routes => {
        return routes.map(route => {
          const entityMonitor = new EntityMonitor(store, route.metadata.guid, routeSchemaKey, entityFactory(routeSchemaKey));
          const request$ = entityMonitor.entityRequest$.pipe(
            tap(request => {
              const unmapping = request.updating['unmapping'] || { busy: false };
              const busy = unmapping.busy;
              rowStateManager.setRowState(route.metadata.guid, {
                deleting: request.deleting.busy,
                error: request.deleting.error,
                blocked: unmapping.busy,
                busy
              });
            })
          );
          return request$;
        });
      }
      ),
      switchMap(endpointObs => combineLatest(endpointObs))
    ).subscribe();
  }

}
