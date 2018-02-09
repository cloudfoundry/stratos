import { Store } from '@ngrx/store';

import { EndpointSchema, GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../../store/app-state';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { map, mergeMap } from 'rxjs/operators';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { tap } from 'rxjs/operators/tap';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';


export class EndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory
  ) {
    const rowStateManager = new TableRowStateManager();
    const action = new GetAllEndpoints();
    const paginationKey = GetAllEndpoints.storeKey;
    super({
      store,
      action,
      schema: EndpointSchema,
      getRowUniqueId: object => object.guid,
      getEmptyType: () => ({
        name: ''
      }),
      paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig,
      rowsState: rowStateManager.observable
    });
    const paginationMonitor = paginationMonitorFactory.create<EndpointModel>(
      paginationKey,
      EndpointSchema
    );
    // This pattern might be worth pulling out into a helper if we use it again.
    const endpointBusySub = paginationMonitor.currentPage$.pipe(
      map(endpoints => endpoints
        .map(endpoint => {
          const entityMonitor = entityMonitorFactory
            .create(endpoint.guid, EndpointSchema.key, EndpointSchema);
          const request$ = entityMonitor.entityRequest$.pipe(
            tap(request => {
              const disconnect = request.updating[EndpointsEffect.disconnectingKey] || { busy: false };
              const unregister = request.updating[EndpointsEffect.unregisteringKey] || { busy: false };
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
    this.store = store;
  }
}
