import { Store } from '@ngrx/store';

import { GetAllOrganizationSpaces } from '../../../../../../../store/src/actions/organization.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organizationSchemaKey, orgGuid);
    const action = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [
      createEntityRelationKey(spaceSchemaKey, spaceQuotaSchemaKey),
    ]);
    super({
      store,
      action,
      schema: entityFactory(spaceWithOrgKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.name' }],
      listConfig
    });
  }
}
