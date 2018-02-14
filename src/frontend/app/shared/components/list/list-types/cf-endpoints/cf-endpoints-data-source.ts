import { Store } from '@ngrx/store';

import { EndpointSchema, GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { AppState } from '../../../../../store/app-state';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { PaginationState } from '../../../../../store/types/pagination.types';
import { CreatePagination } from '../../../../../store/actions/pagination.actions';


export class CFEndpointsDataSource extends ListDataSource<EndpointModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<EndpointModel>
  ) {
    const action = new GetAllEndpoints();
    const paginationKey = 'cf-endpoints';
    // We do this here to ensure we sync up with main endpoint table data.
    store.dispatch(new CreatePagination(
      action.entityKey,
      paginationKey,
      action.paginationKey
    ));
    action.paginationKey = paginationKey;
    super({
      store,
      action,
      schema: EndpointSchema,
      getRowUniqueId: object => object.guid,
      paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: EndpointModel[]) => {
          return entities.filter(endpoint => endpoint.cnsi_type === 'cf');
        },
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig
    });
  }
}
