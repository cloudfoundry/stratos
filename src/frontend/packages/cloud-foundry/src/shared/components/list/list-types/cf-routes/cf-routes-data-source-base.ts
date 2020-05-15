import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { routeEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { safeUnsubscribe } from '../../../../../../../core/src/core/utils.service';
import {
  ListPaginationMultiFilterChange,
  RowsState,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import {
  TableRowStateManager,
} from '../../../../../../../core/src/shared/components/list/list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { PaginationMonitor } from '../../../../../../../store/src/monitors/pagination-monitor';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction, PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { IRoute } from '../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../cf-types';
import { getRoute, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { cfOrgSpaceFilter } from '../../../../../features/cloud-foundry/cf.helpers';
import { CFListDataSource } from '../../../../cf-list-data-source';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';

export interface ListCfRoute extends IRoute {
  url: string;
  isTCPRoute: boolean;
  mappedAppsCount?: number;
  mappedAppsCountLabel?: string;
}

function isListCfRoute(anything: any): boolean {
  return !!anything.url && !!anything.isTCPRoute;
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
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource>,
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
      store,
      action,
      schema: cfEntityFactory(routeEntityType),
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
          if (isListCfRoute(route.entity)) {
            return route as APIResource<ListCfRoute>;
          }
          const entity: ListCfRoute = {
            ...route.entity,
            url: getRoute(route.entity.port, route.entity.host, route.entity.path, true, false, route.entity.domain.entity.name),
            isTCPRoute: isTCPRoute(route.entity.port)
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
    store: Store<AppState>,
    paginationKey,
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

  private static getRowStateManager(store: Store<AppState>, paginationKey: string, isLocal: boolean): {
    rowStateManager: TableRowStateManager,
    sub: Subscription
  } {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = new PaginationMonitor(
      store,
      paginationKey,
      {
        entityType: routeEntityType,
        endpointType: CF_ENDPOINT_TYPE
      },
      isLocal
    );

    const sub = this.setUpManager(
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
    paginationMonitor: PaginationMonitor<APIResource>,
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
