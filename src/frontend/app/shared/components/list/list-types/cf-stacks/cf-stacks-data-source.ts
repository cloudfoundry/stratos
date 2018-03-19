import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { getPaginationKey } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, stackSchemaKey, endpointSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { GetAllStacks } from '../../../../../store/actions/stack.action';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations.types';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationKey(endpointSchemaKey, cfGuid);
    const action = new GetAllStacks(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: entityFactory(stackSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig
    });
  }
}
