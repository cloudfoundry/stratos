import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../../../store/src/actions/endpoint.actions';
import { CreatePagination } from '../../../../../../../store/src/actions/pagination.actions';
import { GetSystemInfo } from '../../../../../../../store/src/actions/system.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { endpointSchemaKey, entityFactory } from '../../../../../../../store/src/helpers/entity-factory';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';


function syncPaginationSection(
  store: Store<AppState>,
  action: GetAllEndpoints,
  paginationKey: string
) {
  store.dispatch(new CreatePagination(
    action.entityKey,
    paginationKey,
    action.paginationKey
  ));
}
export class BaseEndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;
  endpointType: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>,
    endpointType: string,
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = `${endpointType}-endpoints`;
    // We do this here to ensure we sync up with main endpoint table data.
    syncPaginationSection(store, action, paginationKey);
    action.paginationKey = paginationKey;
    super({
      store,
      action,
      schema: entityFactory(endpointSchemaKey),
      getRowUniqueId: object => object.guid,
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: EndpointModel[]) => {
          return entities.filter(endpoint => {
            return endpoint.connectionStatus === 'connected' && endpoint.cnsi_type === endpointType;
          });
        },
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig,
      refresh: () => this.store.dispatch(new GetSystemInfo(false, action))
    });
    this.endpointType = endpointType;
  }
}
