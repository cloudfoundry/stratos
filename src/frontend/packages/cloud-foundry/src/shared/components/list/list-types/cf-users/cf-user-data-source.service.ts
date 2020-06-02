import { Store } from '@ngrx/store';
import { getRowMetadata } from '@stratos/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfUserEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { CfUser } from '../../../../../../../cloud-foundry/src/store/types/user.types';
import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { PaginatedAction, PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { UserListUsersVisible, userListUserVisibleKey } from './cf-user-list-helpers';

function createUserVisibilityFilter(userHasRoles: (user: CfUser) => boolean):
  (entities: APIResource<CfUser>[], paginationState: PaginationEntityState) => APIResource<CfUser>[] {
  return (entities: APIResource<CfUser>[], paginationState: PaginationEntityState): APIResource<CfUser>[] => {
    const filter: UserListUsersVisible = paginationState.clientPagination.filter.items[userListUserVisibleKey];
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
    store: Store<CFAppState>,
    action: PaginatedAction,
    listConfigService: ListConfig<APIResource<CfUser>>,
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
