import { Store } from '@ngrx/store';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  createEntityRelationPaginationKey,
  createEntityRelationKey
} from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import {
  entityFactory,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { GetAllOrganizationSpaces } from '../../../../../../../store/src/actions/organization.actions';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organizationSchemaKey, orgGuid);
    const action = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [
      createEntityRelationKey(spaceSchemaKey, serviceInstancesSchemaKey),
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
