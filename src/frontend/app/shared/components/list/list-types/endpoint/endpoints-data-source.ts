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
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { EndpointDataSourceHelper } from './endpoint-data-source.helpers';


export class EndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory
  ) {
    const action = new GetAllEndpoints();
    const { rowStateManager, sub } = EndpointDataSourceHelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      GetAllEndpoints.storeKey
    );
    super({
      store,
      action,
      schema: EndpointSchema,
      getRowUniqueId: object => object.guid,
      getEmptyType: () => ({
        name: ''
      }),
      paginationKey: GetAllEndpoints.storeKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
  }

}
