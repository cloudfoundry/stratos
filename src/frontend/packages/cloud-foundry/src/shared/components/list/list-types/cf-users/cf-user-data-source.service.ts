import { Store } from '@ngrx/store';
import { getRowMetadata, type GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfUserEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  ListDataSource,
} from '@stratosui/core';
import type { ListConfig } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { PaginatedAction, PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import type { CfUser } from '../../../../../store/types/cf-user.types';
import { UserListUsersVisible, userListUserVisibleKey } from './cf-user-list-helpers';

function createUserVisibilityFilter(userHasRoles: (user: CfUser) => boolean):
  (entities: APIResource<CfUser>[], paginationState: PaginationEntityState) => APIResource<CfUser>[] {
  return (entities: APIResource<CfUser>[], paginationState: PaginationEntityState): APIResource<CfUser>[] => {
    const filter = paginationState.clientPagination.filter.items[userListUserVisibleKey] as UserListUsersVisible;
    if (!filter || filter === UserListUsersVisible.ALL) {
      return entities;
    }
    return entities.reduce((response, user) => {
      const hasARole = userHasRoles(user.entity);
      if ((filter === UserListUsersVisible.WITH_ROLE && hasARole) || (filter === UserListUsersVisible.NO_ROLE && !hasARole)) {
        response.push(user);
      }
      return response;
    }, []);
  };
}


export class CfUserDataSourceService extends ListDataSource<APIResource<CfUser>> {
  constructor(
    store: Store<GeneralEntityAppState>,
    action: PaginatedAction,
    listConfigService: ListConfig<APIResource<CfUser>, APIResource<CfUser>>,
    userHasRoles: (user: CfUser) => boolean
  ) {
    super({
      store,
      action,
      schema: cfEntityFactory(cfUserEntityType),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }, createUserVisibilityFilter(userHasRoles)],
      listConfig: listConfigService
    });
  }

}
