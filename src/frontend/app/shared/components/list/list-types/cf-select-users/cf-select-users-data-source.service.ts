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
  cfUserSchemaKey,
  endpointSchemaKey,
} from '../../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../../store/types/api.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { GetAllOrganizationSpaces } from '../../../../../store/actions/organization.actions';
import { GetAllUsers } from '../../../../../store/actions/users.actions';

export class CfSelectUsersDataSourceService extends ListDataSource<APIResource> {
  constructor(cfGuid: string, store: Store<AppState>, listConfig?: IListConfig<APIResource>) {
    const paginationKey = createEntityRelationPaginationKey(endpointSchemaKey, cfGuid);
    // See issue #1741 - Will not work for non-admins
    const action = new GetAllUsers(paginationKey, cfGuid);
    super({
      store,
      action,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }],
      listConfig
    });
  }
}
