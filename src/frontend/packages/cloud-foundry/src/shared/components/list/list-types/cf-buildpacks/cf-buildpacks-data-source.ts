import { Store } from '@ngrx/store';

import { ListDataSource, IListConfig } from '@stratosui/core';
import { endpointEntityType, getRowMetadata, APIResource } from '@stratosui/store';
import { CFAppState } from '../../../../../cf-app-state';
import { buildpackEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfBuildpacksDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<CFAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
    const action = cfEntityCatalog.buildPack.actions.getMultiple(cfGuid, paginationKey);
    super({
      store,
      action,
      schema: cfEntityFactory(buildpackEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
