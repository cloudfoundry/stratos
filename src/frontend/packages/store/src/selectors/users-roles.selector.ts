import { compose } from '@ngrx/store';

import { CFAppState } from '../../../cloud-foundry/src/cf-app-state';
import { IUserPermissionInOrg } from '../../../cloud-foundry/src/store/types/user.types';
import { UsersRolesState } from '../../../cloud-foundry/src/store/types/users-roles.types';

export const selectUsersRoles = (state: CFAppState): UsersRolesState => state.manageUsersRoles;

const selectUsers = (usersRoles: UsersRolesState) => usersRoles.users;
export const selectUsersRolesPicked = compose(
  selectUsers,
  selectUsersRoles
);

const selectNewRoles = (usersRoles: UsersRolesState) => usersRoles.newRoles;
export const selectUsersRolesRoles = compose(
  selectNewRoles,
  selectUsersRoles
);

const selectCfGuid = (usersRoles: UsersRolesState) => usersRoles.cfGuid;
export const selectUsersRolesCf = compose(
  selectCfGuid,
  selectUsersRoles
);

const selectChanged = (usersRoles: UsersRolesState) => usersRoles.changedRoles;
export const selectUsersRolesChangedRoles = compose(
  selectChanged,
  selectUsersRoles
);

const selectNewRoleOrgGuid = (newRoles: IUserPermissionInOrg) => newRoles.orgGuid;
export const selectUsersRolesOrgGuid = compose(
  selectNewRoleOrgGuid,
  selectNewRoles,
  selectUsersRoles
);
