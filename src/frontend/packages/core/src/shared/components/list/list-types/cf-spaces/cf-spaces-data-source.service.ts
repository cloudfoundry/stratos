import { Store } from '@ngrx/store';

import {
  cfEntityFactory,
  organizationEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
  spaceWithOrgEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllOrganizationSpaces } from '../../../../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<CFAppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organizationEntityType, orgGuid);
    const action = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [
      createEntityRelationKey(spaceEntityType, spaceQuotaEntityType),
    ]);
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
