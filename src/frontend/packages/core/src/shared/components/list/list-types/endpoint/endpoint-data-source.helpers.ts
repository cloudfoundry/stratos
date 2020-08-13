import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map, mergeMap, switchMap, tap } from 'rxjs/operators';

import { DisconnectEndpoint } from '../../../../../../../store/src/actions/endpoint.actions';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitor } from '../../../../../../../store/src/monitors/pagination-monitor';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';


export function EndpointRowStateSetUpManager(
  paginationMonitor: PaginationMonitor<EndpointModel>,
  entityMonitorFactory: EntityMonitorFactory,
  rowStateManager: TableRowStateManager
) {
  return paginationMonitor.currentPage$.pipe(
    distinctUntilChanged(),
    switchMap(entities => entities
      .map(entity => {
        const entityMonitor = entityMonitorFactory
          .create(entity.guid, paginationMonitor.entityConfig);
        const request$ = entityMonitor.entityRequest$.pipe(
          map(request => {
            const disconnect = request.updating[DisconnectEndpoint.UpdatingKey] || { busy: false };
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
