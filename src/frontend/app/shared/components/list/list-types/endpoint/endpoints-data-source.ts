import { Store } from '@ngrx/store';

import { EndpointSchema, GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../../store/app-state';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { ListDataSource, DataFunctionDefinition } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { TableRowStateManager } from '../../list-table/table-row/table-row-state-manager';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { map, mergeMap } from 'rxjs/operators';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { tap } from 'rxjs/operators/tap';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { EndpointsEffect } from '../../../../../store/effects/endpoint.effects';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { ListRowSateHelper } from './endpoint-data-source.helpers';


export class EndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory
  ) {
    const action = new GetAllEndpoints();
    const rowStatehelper = new ListRowSateHelper();
    const { rowStateManager, sub } = rowStatehelper.getRowStateManager(
      paginationMonitorFactory,
      entityMonitorFactory,
      GetAllEndpoints.storeKey
    );
    const config = EndpointsDataSource.getEndpointConfig(
      store,
      action,
      listConfig,
      rowStateManager.observable,
      () => sub.unsubscribe()
    );
    super(config);
  }
  static getEndpointConfig(
    store,
    action,
    listConfig,
    rowsState,
    destroy
  ) {
    return {
      store,
      action,
      schema: EndpointSchema,
      getRowUniqueId: object => object.guid,
      getEmptyType: () => ({
        name: '',
        metricsAvailable: false
      }),
      paginationKey: GetAllEndpoints.storeKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ] as DataFunctionDefinition[],
      listConfig,
      rowsState,
      destroy
    };
  }
}
