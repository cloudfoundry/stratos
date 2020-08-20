import { Store } from '@ngrx/store';

import { GetAllApiKeys } from '../../../../../../../store/src/actions/apiKey.actions';
import { ApiKey } from '../../../../../../../store/src/apiKey.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';


export class ApiKeyDataSource extends ListDataSource<ApiKey> {

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<ApiKey>,
    action: GetAllApiKeys,
  ) {
    // TODO: RC use for 'deleteing'?
    // const rowStateHelper = new ListRowSateHelper();
    // const { rowStateManager, sub } = rowStateHelper.getRowStateManager(
    //   paginationMonitorFactory,
    //   entityMonitorFactory,
    //   action.paginationKey,
    //   action,
    //   EndpointRowStateSetUpManager,
    //   false
    // );

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
          field: 'name' // TODO: RC assign correct column id
        },
      ],
      listConfig,
    });
  }
}
