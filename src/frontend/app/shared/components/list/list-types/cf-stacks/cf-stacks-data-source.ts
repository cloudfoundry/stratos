import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAllStacks } from '../../../../../store/actions/stack.action';
import { AppState } from '../../../../../store/app-state';
import { endpointSchemaKey, entityFactory, stackSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<AppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const action = new GetAllStacks(cfGuid);
    super({
      store,
      action,
      schema: entityFactory(stackSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
