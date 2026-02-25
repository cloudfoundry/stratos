import { Store } from '@ngrx/store';
import { getRowMetadata, APIResource } from '@stratosui/store';
import { ListDataSource, IListConfig } from '@stratosui/core';
import { CFAppState, organizationEntityType, spaceEntityType, spaceQuotaEntityType, createEntityRelationPaginationKey } from '@stratosui/cloud-foundry';
import { createEntityRelationKey } from '../../../../../entity-relations/entity-relations.types';
import { cfEntityCatalog } from '../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../cf-entity-factory';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organizationEntityType, orgGuid);
    const action = cfEntityCatalog.space.actions.getAllInOrganization(orgGuid, cfGuid, paginationKey, {
      includeRelations: [
        createEntityRelationKey(spaceEntityType, spaceQuotaEntityType),
      ]
    });
    super({
      store,
      action,
      schema: cfEntityFactory(spaceEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
