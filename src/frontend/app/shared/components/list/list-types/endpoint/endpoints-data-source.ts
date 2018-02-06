import { Store } from '@ngrx/store';

import { EndpointSchema, GetAllCNSIS } from '../../../../../store/actions/cnsis.actions';
import { AppState } from '../../../../../store/app-state';
import { CNSISModel } from '../../../../../store/types/cnsis.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';


export class EndpointsDataSource extends ListDataSource<CNSISModel> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<CNSISModel>
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
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig
    });
    this.store = store;
  }
}
