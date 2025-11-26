import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import { GetAllOrganizationSpacesWithOrgs } from '../../../../../../../cloud-foundry/src/actions/organization.actions';
import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import {
  cfUserEntityType,
  organizationEntityType,
  spaceEntityType,
} from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../../../../../../cloud-foundry/src/entity-relations/entity-relations.types';
import type {
  CurrentUserPermissionsService,
} from '@stratosui/core';
import {
  ListDataSource,
} from '@stratosui/core';
import type { IListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import type { ISpace } from '../../../../../cf-api.types';
import { CfRolesService } from '../../../../../features/cf/users/manage-users/cf-roles.service';

export class CfUsersSpaceRolesDataSourceService extends ListDataSource<APIResource<ISpace>> {

  constructor(
    cfGuid: string,
    orgGuid: string,
    spaceGuid: string,
    store: Store<GeneralEntityAppState>,
    userPerms: CurrentUserPermissionsService,
    listConfig?: IListConfig<APIResource<ISpace>>
  ) {
    const paginationKey = `${cfUserEntityType}-${orgGuid}`;
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
        (entities: APIResource<ISpace>[], _paginationState: PaginationEntityState) => {
          return entities.filter(e => {
            const validSpace = !(spaceGuid && spaceGuid !== e.metadata.guid);
            return validSpace;
          });
        }],
      listConfig
    });
  }
}
