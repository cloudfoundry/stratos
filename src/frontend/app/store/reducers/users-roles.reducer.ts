import { Action } from '@ngrx/store';

import {
  UsersRolesActions,
  UsersRolesSetChanges,
  UsersRolesSetOrg,
  UsersRolesSetOrgRole,
  UsersRolesSetSpaceRole,
  UsersRolesSetUsers,
} from '../actions/users-roles.actions';
import {
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  OrgUserRoleNames,
} from '../types/user.types';
import { UsersRolesState } from '../types/users-roles.types';

export function createDefaultOrgRoles(orgGuid: string): IUserPermissionInOrg {
  return {
    name: '',
    orgGuid: orgGuid,
    permissions: createUserRoleInOrg(
      undefined,
      undefined,
      undefined,
      undefined),
    spaces: {},
  };
}

export function createDefaultSpaceRoles(orgGuid: string, spaceGuid: string): IUserPermissionInSpace {
  return {
    name: '',
    spaceGuid,
    orgGuid,
    permissions: createUserRoleInSpace(
      undefined,
      undefined,
      undefined
    )
  };
}

const defaultState: UsersRolesState = {
  cfGuid: '',
  users: [],
  newRoles: createDefaultOrgRoles(''),
  changedRoles: []
};

export function UsersRolesReducer(state: UsersRolesState = defaultState, action: Action): UsersRolesState {
  switch (action.type) {
    case UsersRolesActions.SetUsers:
      const setUsersAction = action as UsersRolesSetUsers;
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users,
        // Clear all roles but retain the selected org
        newRoles: createDefaultOrgRoles(state.newRoles ? state.newRoles.orgGuid : '')
      };
    case UsersRolesActions.Clear:
      return defaultState;
    case UsersRolesActions.SetOrg:
      const setOrgAction = action as UsersRolesSetOrg;
      return {
        ...state,
        newRoles: createDefaultOrgRoles(setOrgAction.selectedOrg)
      };
    case UsersRolesActions.SetOrgRole:
      const setOrgRoleAction = action as UsersRolesSetOrgRole;
      return setRole(state, setOrgRoleAction.orgGuid, null, setOrgRoleAction.role, setOrgRoleAction.setRole);
    case UsersRolesActions.SetSpaceRole:
      const setSpaceRoleAction = action as UsersRolesSetSpaceRole;
      return setRole(state, setSpaceRoleAction.orgGuid, setSpaceRoleAction.spaceGuid, setSpaceRoleAction.role, setSpaceRoleAction.setRole);
    case UsersRolesActions.SetChanges:
      const setChangesAction = action as UsersRolesSetChanges;
      return {
        ...state,
        changedRoles: setChangesAction.changes
      };
  }
  return state;
}

function setPermission(roles: IUserPermissionInOrg | IUserPermissionInSpace, role: string, setRole: boolean) {
  if (roles.permissions[role] === setRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: setRole
  };
  return true;
}

function setRole(existingState: UsersRolesState, orgGuid: string, spaceGuid: string, role: string, setRole: boolean): UsersRolesState {
  const existingOrgRoles = existingState.newRoles;
  let newOrgRoles = existingOrgRoles ? {
    ...existingOrgRoles,
    spaces: {
      ...existingOrgRoles.spaces
    }
  } : createDefaultOrgRoles(orgGuid);

  if (spaceGuid) {
    if (!newOrgRoles.spaces[spaceGuid]) {
      newOrgRoles.spaces[spaceGuid] = createDefaultSpaceRoles(orgGuid, spaceGuid);
    }
    const spaceRoles = newOrgRoles.spaces[spaceGuid] = {
      ...newOrgRoles.spaces[spaceGuid]
    };
    newOrgRoles = setPermission(spaceRoles, role, setRole) ? newOrgRoles : null;
    // If the user has applied any space role they must also have the org user role applied too.
    if (newOrgRoles && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        [OrgUserRoleNames.USER]: true
      };
    }
  } else {
    newOrgRoles = setPermission(newOrgRoles, role, setRole) ? newOrgRoles : null;
    // If the user has applied the org manager, auditor or billing manager role they must also have the org user role applied too.
    if (newOrgRoles && role !== 'user' && setRole) {
      newOrgRoles.permissions = {
        ...newOrgRoles.permissions,
        [OrgUserRoleNames.USER]: true
      };
    }
  }

  if (newOrgRoles) {
    return {
      ...existingState,
      newRoles: {
        ...existingState.newRoles,
        ...newOrgRoles,
      }
    };
  }

  return existingState;
}

