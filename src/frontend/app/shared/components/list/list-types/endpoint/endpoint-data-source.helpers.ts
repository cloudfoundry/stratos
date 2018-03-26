import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { map, tap, mergeMap } from 'rxjs/operators';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { entityFactory } from '../../../../../store/helpers/entity-factory';
import { endpointSchemaKey } from '../../../../../store/helpers/entity-factory';

export class ListRowSateHelper {
  public getRowStateManager(
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    paginationKey: string
  ) {
    const rowStateManager = new TableRowStateManager();
    const paginationMonitor = paginationMonitorFactory.create<EndpointModel>(
      paginationKey,
      entityFactory(endpointSchemaKey)
    );

    const sub = this.setUpManager(
      paginationMonitor,
      entityMonitorFactory,
      rowStateManager
    );
    return {
      rowStateManager,
      sub
    };
  }
  // This pattern might be worth pulling out into a more general helper if we use it again.
  private setUpManager(
    paginationMonitor: PaginationMonitor<EndpointModel>,
    entityMonitorFactory: EntityMonitorFactory,
    rowStateManager: TableRowStateManager
  ) {
    return paginationMonitor.currentPage$.pipe(
      map(endpoints => endpoints
        .map(endpoint => {
          const entityMonitor = entityMonitorFactory
            .create(endpoint.guid, endpointSchemaKey, entityFactory(endpointSchemaKey));
          const request$ = entityMonitor.entityRequest$.pipe(
            tap(request => {
              const disconnect = request.updating[EndpointsEffect.disconnectingKey] || { busy: false };
              const unregister = request.deleting || { busy: false };
              const busy = disconnect.busy || unregister.busy;
              const blocked = unregister.busy;
              rowStateManager.setRowState(endpoint.guid, {
                blocked,
                busy
              });
            })
          );
          return request$;
        })
      ),
      mergeMap(endpointObs => combineLatest(endpointObs))
    ).subscribe();
  }
}
