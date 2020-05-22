import { compose } from '@ngrx/store';

import { CFAppState } from '../../cf-app-state';
import { IUserPermissionInOrg } from '../types/user.types';
import { UsersRolesState } from '../types/users-roles.types';

// TODO: RC
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

const isRemove = (usersRoles: UsersRolesState) => usersRoles.isRemove;
export const selectUsersIsRemove = compose(
  isRemove,
  selectUsersRoles
);

const isSetByUsername = (usersRoles: UsersRolesState) => usersRoles.isSetByUsername;
export const selectUsersIsSetByUsername = compose(
  isSetByUsername,
  selectUsersRoles
);
