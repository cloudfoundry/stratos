import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { AppState } from '../../../../../../../store/src/app-state';
import { entityFactory, routeSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/cf-types';

export class SpaceRouteDataSourceHelper {
  static getRowStateManager(
    store: Store<AppState>,
    paginationKey: string
  ) {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = new PaginationMonitor(
      store,
      paginationKey,
      {
        entityType: routeSchemaKey,
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
  static setUpManager(
    store: Store<AppState>,
    paginationMonitor: PaginationMonitor<APIResource>,
    rowStateManager: TableRowStateManager
  ) {
    return paginationMonitor.currentPage$.pipe(
      map(routes => {
        return routes.map(route => {
          const entityMonitor = new EntityMonitor(
            store,
            route.metadata.guid,
            {
              entityType: routeSchemaKey,
              endpointType: CF_ENDPOINT_TYPE
            }
          );
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
