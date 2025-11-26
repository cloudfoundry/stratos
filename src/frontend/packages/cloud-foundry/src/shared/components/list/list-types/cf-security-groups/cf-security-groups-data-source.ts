import { Store } from '@ngrx/store';

import { ListDataSource, type IListConfig } from '@stratosui/core';
import { getRowMetadata, endpointEntityType, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import type { CFAppState } from '../../../../../cf-app-state';
import { securityGroupEntityType } from '../../../../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSecurityGroupsDataSource extends ListDataSource<APIResource> {
  constructor(store: Store<GeneralEntityAppState>, cfGuid: string, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointEntityType, cfGuid);
    const action = cfEntityCatalog.securityGroup.actions.getMultiple(cfGuid, paginationKey, {});
    super({
      store,
      action,
      schema: cfEntityFactory(securityGroupEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
