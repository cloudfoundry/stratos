import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import {
  applicationSchemaKey,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
  entityFactory,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAllOrganizationSpaces } from '../../../../../store/actions/organization.actions';

export class CfSpacesDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, orgGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(organizationSchemaKey, orgGuid);
    const action = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [
      createEntityRelationKey(spaceSchemaKey, applicationSchemaKey),
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
