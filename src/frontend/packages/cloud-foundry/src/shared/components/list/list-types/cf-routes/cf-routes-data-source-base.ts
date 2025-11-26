import { Store } from '@ngrx/store';
import { combineLatest, type Observable, type Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import {
  safeUnsubscribe,
  type ListPaginationMultiFilterChange,
  type RowsState,
  type IListConfig,
  TableRowStateManager
} from '@stratosui/core';
import {
  getRowMetadata,
  type AppState,
  entityCatalog,
  PaginationMonitor,
  type APIResource,
  type PaginatedAction,
  type PaginationParam,
  type GeneralEntityAppState
} from '@stratosui/store';

import type { CFAppState } from '../../../../../cf-app-state';
import { routeEntityType } from '../../../../../cf-entity-types';
import type { IRoute } from '../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { getRoute, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { cfOrgSpaceFilter } from '../../../../../features/cf/cf.helpers';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';

export interface ListCfRoute extends IRoute {
  url: string;
  isTCPRoute: boolean;
  mappedAppsCount?: number;
  mappedAppsCountLabel?: string;
}

function isListCfRoute(anything: IRoute | ListCfRoute): boolean {
  return !!(anything as ListCfRoute).url && !!(anything as ListCfRoute).isTCPRoute;
}

export abstract class CfRoutesDataSourceBase extends CFListDataSource<APIResource<ListCfRoute>, APIResource<IRoute>> {

  cfGuid: string;
  appGuid: string;

  /**
   * Creates an instance of CfRoutesDataSourceBase.
   * @param [appGuid]
   * Are the routes specific to a single app?
   * @param [genericRouteState=true]
   * Use the generic route state which enables the route busy ux
   */
  constructor(
    store: Store<GeneralEntityAppState>,
    listConfig: IListConfig<APIResource<ListCfRoute>>,
    cfGuid: string,
    action: PaginatedAction,
    isLocal: boolean,
    appGuid?: string,
    genericRouteState = true
  ) {
    const { rowsState, sub } = CfRoutesDataSourceBase.createRowState(
      store,
      action.paginationKey,
      genericRouteState,
      action.flattenPagination
    );

    super({
      store: store as Store<AppState>,
      action,
      schema: cfEntityFactory(routeEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal,
      listConfig: listConfig as IListConfig<APIResource<ListCfRoute>>,
      rowsState,
      destroy: () => safeUnsubscribe(sub),
      transformEntities: [
        { type: 'filter', field: 'entity.url' },
        cfOrgSpaceFilter as (entities: APIResource<ListCfRoute>[], paginationState: any) => APIResource<ListCfRoute>[]
      ],
      transformEntity: map(routes => {
        // Supplement route object with additional fields. This allows better sorting and searching
        if (!routes || routes.length === 0) {
          return [];
        }
        return routes.map(route => {
          if (isListCfRoute(route.entity)) {
            return route as APIResource<ListCfRoute>;
          }
          const entity: ListCfRoute = {
            ...route.entity,
            url: getRoute(route.entity.port, route.entity.host ?? '', route.entity.path ?? '', true, false, route.entity.domain?.entity?.name ?? ''),
            isTCPRoute: isTCPRoute(route.entity.port ?? null)
          };

          if (appGuid && route.entity.apps) {
            const apps = route.entity.apps.filter(app => !!app);
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
   */
  private static createRowState(
    store: Store<GeneralEntityAppState>,
    paginationKey: string,
    genericRouteState: boolean,
    isLocal: boolean): { rowsState: Observable<RowsState>, sub: Subscription } {
    if (genericRouteState) {
      const { rowStateManager, sub } = CfRoutesDataSourceBase.getRowStateManager(store, paginationKey, isLocal);
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

  private static getRowStateManager(store: Store<GeneralEntityAppState>, paginationKey: string, isLocal: boolean): {
    rowStateManager: TableRowStateManager,
    sub: Subscription
  } {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = new PaginationMonitor<APIResource<IRoute>>(
      store,
      paginationKey,
      {
        entityType: routeEntityType,
        endpointType: CF_ENDPOINT_TYPE
      },
      isLocal
    );

    const sub = CfRoutesDataSourceBase.setUpManager(
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
    paginationMonitor: PaginationMonitor<APIResource<IRoute>>,
    rowStateManager: TableRowStateManager
  ) {
    return paginationMonitor.currentPage$.pipe(
      map(routes => {
        return routes.map(route => {
          const catalogEntity = entityCatalog.getEntity({
            entityType: routeEntityType,
            endpointType: CF_ENDPOINT_TYPE
          });
          const entityMonitor = catalogEntity.store.getEntityMonitor(route.metadata.guid);
          const request$ = entityMonitor.entityRequest$.pipe(
            tap(request => {
              const unmapping = request.updating.unmapping || { busy: false };
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
