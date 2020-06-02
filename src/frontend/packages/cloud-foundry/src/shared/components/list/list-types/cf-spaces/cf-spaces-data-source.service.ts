import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  organizationEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
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
