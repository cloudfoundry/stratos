import { compose } from '@ngrx/store';

import { CFAppState } from '../../cf-app-state';
import { IUserPermissionInOrg } from '../types/cf-user.types';
import { UsersRolesState } from '../types/users-roles.types';

export const selectCfUsersRoles = (state: CFAppState): UsersRolesState => state.manageUsersRoles;

const selectUsers = (usersRoles: UsersRolesState) => usersRoles.users;
export const selectCfUsersRolesPicked = compose(
  selectUsers,
  selectCfUsersRoles
);

const selectNewRoles = (usersRoles: UsersRolesState) => usersRoles.newRoles;
export const selectCfUsersRolesRoles = compose(
  selectNewRoles,
  selectCfUsersRoles
);

const selectCfGuid = (usersRoles: UsersRolesState) => usersRoles.cfGuid;
export const selectCfUsersRolesCf = compose(
  selectCfGuid,
  selectCfUsersRoles
);

const selectChanged = (usersRoles: UsersRolesState) => usersRoles.changedRoles;
export const selectCfUsersRolesChangedRoles = compose(
  selectChanged,
  selectCfUsersRoles
);

const selectNewRoleOrgGuid = (newRoles: IUserPermissionInOrg) => newRoles.orgGuid;
export const selectCfUsersRolesOrgGuid = compose(
  selectNewRoleOrgGuid,
  selectNewRoles,
  selectCfUsersRoles
);

const isRemove = (usersRoles: UsersRolesState) => usersRoles.isRemove;
export const selectCfUsersIsRemove = compose(
  isRemove,
  selectCfUsersRoles
);

const isSetByUsername = (usersRoles: UsersRolesState) => usersRoles.isSetByUsername;
export const selectCfUsersIsSetByUsername = compose(
  isSetByUsername,
  selectCfUsersRoles
);
