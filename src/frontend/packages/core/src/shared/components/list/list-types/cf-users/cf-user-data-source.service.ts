import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CfUser } from '../../../../../../../store/src/types/user.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';
import { ListConfig } from '../../list.component.types';
import { entityFactory, cfUserSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';


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
