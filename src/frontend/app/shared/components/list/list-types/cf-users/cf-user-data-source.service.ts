import { Store } from '@ngrx/store';

import { getRowMetadata } from '../../../../../features/cloud-foundry/cf.helpers';
import { cfUserSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { PaginatedAction, PaginationEntityState } from '../../../../../store/types/pagination.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { ListConfig } from '../../list.component.types';
import { AppState } from './../../../../../store/app-state';
import { APIResource } from './../../../../../store/types/api.types';
import { CfUser } from './../../../../../store/types/user.types';

export const userListUserVisibleKey = 'showUsers';
// TODO: RC location
export enum UserListUsersVisible {
  ALL = 'all',
  WITH_ROLE = 'withRole',
  NO_ROLE = 'noRole'
}

// export const userHas(): boolean {
//   return false;
// }

export const userHasRole = (user: CfUser, roleProperty: string): boolean => {
  return !!user[roleProperty] && !!user[roleProperty].length;
};

// const userHasAnyRole = (user: CfUser): boolean => {
//   return userHasRole(user, 'organizations') ||
//     userHasRole(user, 'spaces') ||
//     userHasRole(user, 'managed_organizations') ||
//     userHasRole(user, 'managed_spaces') ||
//     userHasRole(user, 'audited_organizations') ||
//     userHasRole(user, 'audited_spaces') ||
//     userHasRole(user, 'billing_managed_organizations');
// };

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
