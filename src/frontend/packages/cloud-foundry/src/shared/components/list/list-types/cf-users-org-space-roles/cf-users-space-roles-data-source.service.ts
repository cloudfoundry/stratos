import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratosui/store';

import { GetAllOrganizationSpacesWithOrgs } from '../../../../../../../cloud-foundry/src/actions/organization.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { ISpace } from '../../../../../cf-api.types';
import { CfRolesService } from '../../../../../features/cloud-foundry/users/manage-users/cf-roles.service';

export class CfUsersSpaceRolesDataSourceService extends ListDataSource<APIResource<ISpace>> {

  constructor(
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string,
    store: Store<CFAppState>,
    userPerms: CurrentUserPermissionsService,
    listConfig?: IListConfig<APIResource>
  ) {
    const paginationKey = cfUserEntityType + '-' + orgGuid;
    const action = new GetAllOrganizationSpacesWithOrgs(
      paginationKey,
      orgGuid,
      cfGuid,
      [createEntityRelationKey(spaceEntityType, organizationEntityType)]
    );
    super({
      store,
      action,
      schema: action.entity,
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
