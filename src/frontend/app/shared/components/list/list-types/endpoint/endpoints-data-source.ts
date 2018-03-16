import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../../store/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { EntityMonitorFactory } from '../../../../monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../monitors/pagination-monitor.factory';
import { DataFunctionDefinition, ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
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
      schema: entityFactory(endpointSchemaKey),
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
      ] as DataFunctionDefinition[],
      listConfig,
      rowsState,
      destroy
    };
  }
}
