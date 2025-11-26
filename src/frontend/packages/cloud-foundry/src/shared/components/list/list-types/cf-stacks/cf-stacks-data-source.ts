import { Store } from '@ngrx/store';

import { ListDataSource, type IListConfig } from '@stratosui/core';
import { getRowMetadata, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../cf-app-state';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { stackEntityType } from '../../../../../cf-entity-types';

export class CfStacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<GeneralEntityAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const action = cfEntityCatalog.stack.actions.getMultiple(null, cfGuid);
    super({
      store,
      action,
      schema: cfEntityFactory(stackEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
