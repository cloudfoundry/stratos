import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { EndpointSchema } from '../../../../../store/actions/endpoint.actions';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { map, tap, mergeMap, switchMap } from 'rxjs/operators';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { RouteSchema } from '../../../../../store/actions/route.actions';
import { AppState } from '../../../../../store/app-state';
import { Store } from '@ngrx/store';
import { EntityMonitor } from '../../../../monitors/entity-monitor';
import { APIResource } from '../../../../../store/types/api.types';

export class SpaceRouteDataSourceHelper {
  static getRowStateManager(
    store: Store<AppState>,
    paginationKey: string
  ) {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = new PaginationMonitor(
      store,
      paginationKey,
      RouteSchema
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
      map(routes => routes
        .map(route => {
          const entityMonitor = new EntityMonitor(store, route.metadata.guid, RouteSchema.key, RouteSchema);
          const request$ = entityMonitor.entityRequest$.pipe(
            tap(request => {
              const unmapping = request.updating['unmapping'] || { busy: false };
              const blocked = request.deleting.busy;
              const busy = unmapping.busy;
              rowStateManager.setRowState(route.metadata.guid, {
                blocked,
                busy
              });
            })
          );
          return request$;
        })
      ),
      switchMap(endpointObs => combineLatest(endpointObs))
    ).subscribe();
  }
}
