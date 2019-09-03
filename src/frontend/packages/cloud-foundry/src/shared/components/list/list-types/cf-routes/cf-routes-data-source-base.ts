import { Store } from '@ngrx/store';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfEntityFactory, routeEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { IRoute } from '../../../../../../../core/src/core/cf-api.types';
import { entityCatalogue } from '../../../../../../../core/src/core/entity-catalogue/entity-catalogue.service';
import { safeUnsubscribe } from '../../../../../../../core/src/core/utils.service';
import {
  ListPaginationMultiFilterChange,
  RowsState,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import {
  TableRowStateManager,
} from '../../../../../../../core/src/shared/components/list/list-table/table-row/table-row-state-manager';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationMonitor } from '../../../../../../../core/src/shared/monitors/pagination-monitor';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction, PaginationParam } from '../../../../../../../store/src/types/pagination.types';
import { getRoute, isTCPRoute } from '../../../../../features/applications/routes/routes.helper';
import { cfOrgSpaceFilter, getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { createCfOrSpaceMultipleFilterFn } from '../../../../data-services/cf-org-space-service.service';
import { CFListDataSource } from '../../../../../../../store/src/cf-list-data-source';

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
    const { rowsState, sub } = CfRoutesDataSourceBase.createRowState(store, action.paginationKey, genericRouteState);

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

  private static getRowStateManager(store: Store<CFAppState>, paginationKey: string): {
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
      }
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
    store: Store<CFAppState>,
    paginationMonitor: PaginationMonitor<APIResource>,
    rowStateManager: TableRowStateManager
  ) {
    return paginationMonitor.currentPage$.pipe(
      map(routes => {
        return routes.map(route => {
          const catalogueEntity = entityCatalogue.getEntity({
            entityType: routeEntityType,
            endpointType: CF_ENDPOINT_TYPE
          });
          const entityMonitor = catalogueEntity.getEntityMonitor(store, route.metadata.guid);
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
