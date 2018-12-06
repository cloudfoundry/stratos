import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { cfUserSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { PaginatedAction } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListConfig } from '../../list.component.types';
import { AppState } from './../../../../../store/app-state';
import { APIResource } from './../../../../../store/types/api.types';
import { CfUser } from './../../../../../store/types/user.types';


export class CfUserDataSourceService extends ListDataSource<APIResource<CfUser>> {
  constructor(store: Store<AppState>, action: PaginatedAction, listConfigService: ListConfig<APIResource<CfUser>>) {
    super({
      store,
      action,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }],
      listConfig: listConfigService
    });
  }

}
