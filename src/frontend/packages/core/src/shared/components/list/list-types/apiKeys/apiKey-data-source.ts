import { Store } from '@ngrx/store';
import { AppState, GetAllApiKeys, ApiKey } from '@stratosui/store';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class ApiKeyDataSource extends ListDataSource<ApiKey> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<ApiKey>,
    action: GetAllApiKeys,
  ) {
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (object) => action.entity[0].getId(object),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'comment'
        },
      ],
      listConfig,
    });
  }
}
