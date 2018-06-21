import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { PaginationMonitor } from '../../../../monitors/pagination-monitor';
import { CfUser } from '../../../../../store/types/user.types';
import { setupCfUserStateManager } from '../cf-users/cf-user-data-source.service';

export class CfSelectUsersDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, store: Store<AppState>, getAllUsersAction: PaginatedAction, listConfig?: IListConfig<APIResource>) {
    const { paginationKey } = getAllUsersAction;
    const paginationMonitor = new PaginationMonitor<APIResource<CfUser>>(store, paginationKey, entityFactory(cfUserSchemaKey));
    const { sub, rowStateManager } = setupCfUserStateManager(paginationMonitor);
    super({
      store,
      action: getAllUsersAction,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: getAllUsersAction.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }],
      listConfig,
      rowsState: rowStateManager.observable,
      destroy: () => sub.unsubscribe()
    });
  }
}
