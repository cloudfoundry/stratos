import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { CfUser } from '../../../../../../../store/src/types/user.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { PaginatedAction, PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { ListConfig } from '../../list.component.types';
import { entityFactory, cfUserSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import {
  UserListUsersVisible,
  userListUserVisibleKey
} from '../../../../../../../../app/shared/components/list/list-types/cf-users/cf-user-list-helpers';

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
    store: Store<AppState>,
    action: PaginatedAction,
    listConfigService: ListConfig<APIResource<CfUser>>,
    userHasRoles: (user: CfUser) => boolean
  ) {
    super({
      store,
      action,
      schema: entityFactory(cfUserSchemaKey),
      getRowUniqueId: getRowMetadata,
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [{ type: 'filter', field: 'entity.username' }, createUserVisibilityFilter(userHasRoles)],
      listConfig: listConfigService
    });
  }

}
