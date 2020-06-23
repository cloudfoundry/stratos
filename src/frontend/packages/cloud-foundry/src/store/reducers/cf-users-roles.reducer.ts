import { Action } from '@ngrx/store';

import {
  UsersRolesActions,
  UsersRolesSetChanges,
  UsersRolesSetIsRemove,
  UsersRolesSetIsSetByUsername,
  UsersRolesSetOrg,
  UsersRolesSetOrgRole,
  UsersRolesSetSpaceRole,
  UsersRolesSetUsers,
} from '../../actions/users-roles.actions';
import {
  createUserRoleInOrg,
  createUserRoleInSpace,
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  OrgUserRoleNames,
} from '../types/cf-user.types';
import { UsersRolesState } from '../types/users-roles.types';

export function createDefaultOrgRoles(orgGuid: string, orgName: string): IUserPermissionInOrg {
  return {
    name: orgName,
    orgGuid,
    permissions: createUserRoleInOrg(
      undefined,
      undefined,
      undefined,
      undefined),
    spaces: {},
  };
}

export function createDefaultSpaceRoles(orgGuid: string, orgName: string, spaceGuid: string, spaceName: string): IUserPermissionInSpace {
  return {
    name: spaceName,
    spaceGuid,
    orgGuid,
    orgName,
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
  newRoles: createDefaultOrgRoles('', ''),
  changedRoles: []
};

export function cfUsersRolesReducer(state: UsersRolesState = defaultState, action: Action): UsersRolesState {
  switch (action.type) {
    case UsersRolesActions.SetUsers:
      const setUsersAction = action as UsersRolesSetUsers;
      const orgGuid = state.newRoles ? state.newRoles.orgGuid : '';
      const orgName = state.newRoles ? state.newRoles.name : '';
      return {
        ...state,
        cfGuid: setUsersAction.cfGuid,
        users: setUsersAction.users,
        // Clear all roles but retain the selected org
        newRoles: createDefaultOrgRoles(orgGuid, orgName),
        usernameOrigin: setUsersAction.origin
      };
    case UsersRolesActions.Clear:
      return defaultState;
    case UsersRolesActions.SetOrg:
      const setOrgAction = action as UsersRolesSetOrg;
      return {
        ...state,
        newRoles: createDefaultOrgRoles(setOrgAction.orgGuid, setOrgAction.orgName)
      };
    case UsersRolesActions.SetOrgRole:
      const setOrgRoleAction = action as UsersRolesSetOrgRole;
      return setRole(
        state,
        setOrgRoleAction.orgGuid,
        setOrgRoleAction.orgName,
        null,
        null,
        setOrgRoleAction.role,
        setOrgRoleAction.setRole,
        state.isSetByUsername
      );
    case UsersRolesActions.SetSpaceRole:
      const setSpaceRoleAction = action as UsersRolesSetSpaceRole;
      return setRole(
        state,
        setSpaceRoleAction.orgGuid,
        setSpaceRoleAction.orgName,
        setSpaceRoleAction.spaceGuid,
        setSpaceRoleAction.spaceName,
        setSpaceRoleAction.role,
        setSpaceRoleAction.setRole,
        state.isSetByUsername
      );
    case UsersRolesActions.SetChanges:
      const setChangesAction = action as UsersRolesSetChanges;
      return {
        ...state,
        changedRoles: setChangesAction.changes
      };
    case UsersRolesActions.FlipSetRoles:
      return {
        ...state,
        changedRoles: state.changedRoles.map(change => {
          return {
            ...change,
            add: !change.add
          };
        })
      };
    case UsersRolesActions.SetIsRemove:
      const isRemoveAction = action as UsersRolesSetIsRemove;
      return {
        ...state,
        isRemove: isRemoveAction.isRemove
      };
    case UsersRolesActions.SetIsSetByUsername:
      const isSetByUsernameAction = action as UsersRolesSetIsSetByUsername;
      return {
        ...state,
        isSetByUsername: isSetByUsernameAction.isSetByUsername
      };
  }
  return state;
}

function setPermission(roles: IUserPermissionInOrg | IUserPermissionInSpace, role: string, applyRole: boolean) {
  if (roles.permissions[role] === applyRole) {
    return false;
  }
  roles.permissions = {
    ...roles.permissions,
    [role]: applyRole
  };
  return true;
}

function setRole(
  existingState: UsersRolesState,
  orgGuid: string,
  orgName: string,
  spaceGuid: string,
  spaceName: string,
  role: string,
  applyRole: boolean,
  isSetByUsername: boolean = false): UsersRolesState {
  // Create a fresh instance of the org roles
  let newOrgRoles = cloneOrgRoles(existingState.newRoles, orgGuid, orgName);

  if (spaceGuid) {
    // Space role change
    setSpaceRole(newOrgRoles, orgGuid, orgName, spaceGuid, spaceName, role, applyRole, isSetByUsername);
  } else {
    // Org role change
    newOrgRoles = setOrgRole(newOrgRoles, role, applyRole, isSetByUsername);
  }

  // There's been no change to the existing state, just return the existing state;
  if (!newOrgRoles) {
    return existingState;
  }
  return {
    ...existingState,
    newRoles: {
      ...existingState.newRoles,
      ...newOrgRoles,
    }
  };
}

function cloneOrgRoles(orgRoles: IUserPermissionInOrg, orgGuid: string, orgName: string): IUserPermissionInOrg {
  return orgRoles ? {
    ...orgRoles,
    spaces: {
      ...orgRoles.spaces
    }
  } : createDefaultOrgRoles(orgGuid, orgName);
}

function setSpaceRole(
  orgRoles: IUserPermissionInOrg,
  orgGuid: string,
  orgName: string,
  spaceGuid: string,
  spaceName: string,
  role: string,
  applyRole: boolean,
  isSetByUsername: boolean) {
  if (!orgRoles.spaces[spaceGuid]) {
    orgRoles.spaces[spaceGuid] = createDefaultSpaceRoles(orgGuid, orgName, spaceGuid, spaceName);
  }
  const spaceRoles = orgRoles.spaces[spaceGuid] = {
    ...orgRoles.spaces[spaceGuid]
  };
  orgRoles = setPermission(spaceRoles, role, applyRole) ? orgRoles : null;
  // If the user has applied any space role they must also have the org user role applied too.
  if (orgRoles && applyRole && !isSetByUsername) {
    orgRoles.permissions = {
      ...orgRoles.permissions,
      [OrgUserRoleNames.USER]: true
    };
  }
}

function setOrgRole(orgRoles: IUserPermissionInOrg, role: string, applyRole: boolean, isSetByUsername: boolean): IUserPermissionInOrg {
  orgRoles = setPermission(orgRoles, role, applyRole) ? orgRoles : null;
  // If the user has applied the org manager, auditor or billing manager role they must also have the org user role applied too.
  if (orgRoles && role !== 'user' && applyRole && !isSetByUsername) {
    orgRoles.permissions = {
      ...orgRoles.permissions,
      [OrgUserRoleNames.USER]: true
    };
  }
  return orgRoles;
}

