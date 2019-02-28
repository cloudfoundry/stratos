
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, switchMap, tap } from 'rxjs/operators';

import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { EndpointsEffect } from '../../../../../../../store/src/effects/endpoint.effects';

export function EndpointRowStateSetUpManager(
  paginationMonitor: PaginationMonitor<EndpointModel>,
  entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager,
  schemaKey: string
) {
  return paginationMonitor.currentPage$.pipe(
    distinctUntilChanged(),
    switchMap(entities => entities
      .map(entity => {
        const entityMonitor = entityMonitorFactory
          .create(entity.guid, schemaKey, entityFactory(schemaKey));
        const request$ = entityMonitor.entityRequest$.pipe(
          map(request => {
            const disconnect = request.updating[EndpointsEffect.disconnectingKey] || { busy: false };
            const unregister = request.deleting || { busy: false };
            const busy = disconnect.busy || unregister.busy;
            const blocked = unregister.busy;
            return {
              blocked,
              busy
            };
          }),
          distinctUntilChanged((oldRowState, newRowState) => {
            return oldRowState.blocked === newRowState.blocked &&
              oldRowState.busy === newRowState.busy;
          }),
          tap(rowState => rowStateManager.updateRowState(entity.guid, rowState))
        );
        return request$;
      })
    ),
    mergeMap(endpointObs => combineLatest(endpointObs))
  ).subscribe();
}
