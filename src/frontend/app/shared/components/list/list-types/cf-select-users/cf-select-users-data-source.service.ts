import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import { cfUserSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSelectUsersDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, store: Store<AppState>, getAllUsersAction: PaginatedAction, listConfig?: IListConfig<APIResource>) {
    super({
      store,
      action: getAllUsersAction,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: getAllUsersAction.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }],
      listConfig
    });
  }
}
