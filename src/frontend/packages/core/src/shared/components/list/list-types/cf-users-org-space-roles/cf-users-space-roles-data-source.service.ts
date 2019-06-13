import { Store } from '@ngrx/store';

import { GetAllOrganizationSpaces } from '../../../../../../../store/src/actions/organization.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import {
  cfUserSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../../../../../store/src/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { ISpace } from '../../../../../core/cf-api.types';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CfRolesService } from '../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';

export class CfUsersSpaceRolesDataSourceService extends ListDataSource<APIResource<ISpace>> {
  constructor(
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string,
    store: Store<AppState>,
    userPerms: CurrentUserPermissionsService,
    listConfig?: IListConfig<APIResource>) {
    const paginationKey = cfUserSchemaKey + '-' + orgGuid;
    const action
      = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [createEntityRelationKey(spaceSchemaKey, organizationSchemaKey)]);
    action.entityKey = spaceSchemaKey;
    action.entity = entityFactory(spaceWithOrgKey);
    super({
      store,
      action,
      schema: entityFactory(spaceWithOrgKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntity: (spaces$) => CfRolesService.filterEditableOrgOrSpace<ISpace>(userPerms, false, spaces$),
      transformEntities: [
        {
          type: 'filter',
          field: 'entity.name'
        },
        (entities: APIResource[], paginationState: PaginationEntityState) => {
          return entities.filter(e => {
            const validSpace = !(spaceGuid && spaceGuid !== e.metadata.guid);
            return validSpace;
          });
        }],
      listConfig
    });
  }
}
