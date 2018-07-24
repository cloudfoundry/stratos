import { GetAllOrgUsers } from '../actions/organization.actions';
import { IOrganization, ISpace } from '../../core/cf-api.types';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint } from '../actions/endpoint.actions';
import {
  ADD_ROLE_SUCCESS,
  ChangeUserRole,
  GET_CF_USERS_AS_NON_ADMIN_SUCCESS,
  GetAllUsersAsNonAdmin,
  REMOVE_ROLE_SUCCESS,
} from '../actions/users.actions';
import { IRequestEntityTypeState } from '../app-state';
import { APIResource, NormalizedResponse } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';
import { CfUser, CfUserRoleParams, OrgUserRoleNames, SpaceUserRoleNames } from '../types/user.types';
import { APIResponse } from '../actions/request.actions';
import { cfUserSchemaKey } from '../helpers/entity-factory';
import { deepMergeState } from '../helpers/reducer.helper';

const properties = {
  org: {
    [OrgUserRoleNames.MANAGER]: CfUserRoleParams.MANAGER_ORGS,
    [OrgUserRoleNames.BILLING_MANAGERS]: CfUserRoleParams.BILLING_MANAGER_ORGS,
    [OrgUserRoleNames.AUDITOR]: CfUserRoleParams.AUDITED_ORGS,
    [OrgUserRoleNames.USER]: CfUserRoleParams.ORGANIZATIONS,
  },
  space: {
    [SpaceUserRoleNames.MANAGER]: CfUserRoleParams.MANAGED_SPACES,
    [SpaceUserRoleNames.AUDITOR]: CfUserRoleParams.AUDITED_SPACES,
    [SpaceUserRoleNames.DEVELOPER]: CfUserRoleParams.SPACES
  }
};

export function userReducer(state: IRequestEntityTypeState<APIResource<CfUser>>, action: APISuccessOrFailedAction) {
  switch (action.type) {
    case ADD_ROLE_SUCCESS:
    case REMOVE_ROLE_SUCCESS:
      // Ensure that a user's roles collections are updated when we call add/remove
      const permAction = action.apiAction as ChangeUserRole;
      const { entityGuid, isSpace, permissionTypeKey, userGuid } = permAction;
      return {
        ...state,
        [userGuid]: {
          ...state[userGuid],
          entity: updatePermission(state[userGuid].entity, entityGuid, isSpace, permissionTypeKey, action.type === ADD_ROLE_SUCCESS),
        }
      };
    case GetAllOrgUsers.actions[1]:
      // Determine if any of the user's roles have not been provided
      return updateUserMissingRoles(state, action);
  }
  return state;
}

export function endpointDisconnectUserReducer(state: IRequestEntityTypeState<APIResource<CfUser>>, action: DisconnectEndpoint) {
  if (action.endpointType === 'cf') {
    switch (action.type) {
      case DISCONNECT_ENDPOINTS_SUCCESS:
        const cfGuid = action.guid;
        // remove users that belong to this CF
        const newUsers = {};
        Object.values(state)
          .filter(u => u.entity.cfGuid !== cfGuid)
          .forEach(u => newUsers[u.metadata.guid] = u);
        return newUsers;
    }
  }
  return state;
}

function updatePermission(
  user: CfUser,
  entityGuid: string,
  isSpace: boolean,
  permissionType: OrgUserRoleNames | SpaceUserRoleNames,
  add = false) {
  const type = isSpace ? 'space' : 'org';
  const paramName = properties[type][permissionType];
  const newCollection = add ?
    [...user[paramName], entityGuid] :
    user[paramName].filter(guid => guid !== entityGuid);
  return {
    ...user,
    [paramName]: newCollection
  };
}

type StateEntity = ISpace | IOrganization;
interface StateEntities<T> { [guid: string]: APIResource<StateEntity>; }

export function userSpaceOrgReducer<T extends StateEntity>(isSpace: boolean) {
  return function (state: StateEntities<T>, action: APISuccessOrFailedAction) {
    switch (action.type) {
      case ADD_ROLE_SUCCESS:
      case REMOVE_ROLE_SUCCESS:
        // Ensure that an org or space's roles lists are updated when we call add/remove
        const permAction = action.apiAction as ChangeUserRole;
        const isAdd = action.type === ADD_ROLE_SUCCESS ? true : false;
        return (isSpace && !!permAction.isSpace) || (!isSpace && !permAction.isSpace) ? newEntityState<T>(state, permAction, isAdd) : state;
    }
    return state;
  };
}

function newEntityState<T extends StateEntity>(state: StateEntities<T>, action: ChangeUserRole, add: boolean): StateEntities<T> {
  const apiResource: APIResource<StateEntity> = state[action.guid];
  if (!apiResource) {
    return state;
  }
  let roles: string[] = apiResource.entity[action.permissionTypeKey];
  if (!roles) {
    // No roles in entity, we can't modify them if they don't exist
    return state;
  }

  const index = roles.findIndex(guid => guid === action.userGuid);
  const exists = index >= 0;

  if (add && !exists) {
    // Add the user to the role as it doesn't exist already
    roles = [
      ...roles,
      action.userGuid
    ];
  } else if (!add && !exists) {
    // Remove the user from the role... but only if it exists already
    roles = [...roles];
    roles.splice(index, 1);
  } else {
    // There's been no change, return the original state
    return state;
  }

  return {
    ...state,
    [action.guid]: {
      ...apiResource,
      entity: Object.assign({}, apiResource.entity, {
        [action.permissionTypeKey]: roles
      })
    }
  };
}

function updateUserMissingRoles(users: IRequestEntityTypeState<APIResource<CfUser>>, action: APISuccessOrFailedAction<NormalizedResponse>) {
  const usersInResponse: IRequestEntityTypeState<APIResource<CfUser>> = action.response.entities[cfUserSchemaKey];

  const haveUpdatedUsers = Object.values(usersInResponse).reduce((changes, user) => {
    const oldMissingRoles = users[user.entity.guid] ? users[user.entity.guid].entity.missingRoles || [] : [];
    const newMissingRoles = [];
    Object.values(CfUserRoleParams).forEach(roleParam => {
      if (!user.entity[roleParam] && oldMissingRoles.indexOf(roleParam) < 0) {
        newMissingRoles.push(roleParam);
      }
    });
    user.entity.missingRoles = newMissingRoles;
    return newMissingRoles.length || changes;
  }, false);

  return haveUpdatedUsers ? {
    ...users,
    [cfUserSchemaKey]: deepMergeState(users, usersInResponse)
  } : users;

}
