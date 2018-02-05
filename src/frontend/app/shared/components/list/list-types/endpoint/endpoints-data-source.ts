import { Store } from '@ngrx/store';

import { EndpointSchema, GetAllCNSIS } from '../../../../../store/actions/cnsis.actions';
import { AppState } from '../../../../../store/app-state';
import { CNSISModel } from '../../../../../store/types/cnsis.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';


export class EndpointsDataSource extends ListDataSource<CNSISModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
  ) {
    const action = new GetAllCNSIS();
    const paginationKey = GetAllCNSIS.storeKey;
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
      entityFunctions: [
        {
          type: 'filter',
          field: 'name'
        },
        {
          type: 'sort',
          orderKey: 'name',
          field: 'name'
        },
        {
          type: 'sort',
          orderKey: 'connection',
          field: 'info.user'
        },
        {
          type: 'sort',
          orderKey: 'type',
          field: 'cnsi_type'
        },
        {
          type: 'sort',
          orderKey: 'address',
          field: 'api_endpoint.Host'
        },
      ],
    });
    this.store = store;
  }
}
