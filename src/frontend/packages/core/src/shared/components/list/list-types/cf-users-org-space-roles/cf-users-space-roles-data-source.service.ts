import { Store } from '@ngrx/store';

import {
  cfEntityFactory,
  cfUserEntityType,
  spaceEntityType,
  organizationEntityType,
  spaceWithOrgEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { GetAllOrganizationSpaces } from '../../../../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { ISpace } from '../../../../../core/cf-api.types';
import { CurrentUserPermissionsService } from '../../../../../core/current-user-permissions.service';
import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { CfRolesService } from '../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { createEntityRelationKey } from '../../../../../../../store/src/helpers/entity-relations/entity-relations.types';

export class CfUsersSpaceRolesDataSourceService extends ListDataSource<APIResource<ISpace>> {
  constructor(
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string,
    store: Store<CFAppState>,
    userPerms: CurrentUserPermissionsService,
    listConfig?: IListConfig<APIResource>) {
    const paginationKey = cfUserEntityType + '-' + orgGuid;
    const action
      = new GetAllOrganizationSpaces(paginationKey, orgGuid, cfGuid, [createEntityRelationKey(spaceEntityType, organizationEntityType)]);
    action.entityType = spaceEntityType;
    action.entity = cfEntityFactory(spaceWithOrgEntityType);
    super({
      store,
      action,
      schema: cfEntityFactory(spaceWithOrgEntityType),
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
