import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint } from '../../../../store/src/actions/endpoint.actions';
import { IRequestEntityTypeState } from '../../../../store/src/app-state';
import { deepMergeState } from '../../../../store/src/helpers/reducer.helper';
import { APIResource, NormalizedResponse } from '../../../../store/src/types/api.types';
import { APISuccessOrFailedAction } from '../../../../store/src/types/request.types';
import { GET_ORGANIZATION_USERS_SUCCESS, GetAllOrgUsers } from '../../actions/organization.actions';
import {
  ADD_ROLE_SUCCESS,
  ChangeUserRole,
  createDefaultUserRelations,
  REMOVE_ROLE_SUCCESS,
} from '../../actions/users.actions';
import { IOrganization, ISpace } from '../../cf-api.types';
import { cfUserEntityType } from '../../cf-entity-types';
import {
  CfUser,
  CfUserMissingOrgRoles,
  CfUserMissingSpaceRoles,
  CfUserRoleParams,
  getDefaultCfUserMissingRoles,
  OrgUserRoleNames,
  SpaceUserRoleNames,
} from '../types/user.types';

const properties = {
  org: {
    [OrgUserRoleNames.MANAGER]: CfUserRoleParams.MANAGED_ORGS,
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
      if (permAction.username) {
        return state;
      }
      const { entityGuid, isSpace, permissionTypeKey, userGuid } = permAction;
      return {
        ...state,
        [userGuid]: {
          ...state[userGuid],
          entity: updatePermission(state[userGuid].entity, entityGuid, isSpace, permissionTypeKey, action.type === ADD_ROLE_SUCCESS),
        }
      };
    case GET_ORGANIZATION_USERS_SUCCESS:
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
type StateEntities<T> = IRequestEntityTypeState<APIResource<T>>;

export function userSpaceOrgReducer<T = StateEntity>(isSpace: boolean) {
  return (state: StateEntities<T>, action: APISuccessOrFailedAction) => {
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

function newEntityState<T = StateEntity>(state: StateEntities<T>, action: ChangeUserRole, add: boolean): StateEntities<T> {
  const apiResource: APIResource<T> = state[action.guid];
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

/**
 * Determine if the user entity is missing any roles. If so track them in an array
 */
function updateUserMissingRoles(users: IRequestEntityTypeState<APIResource<CfUser>>, action: APISuccessOrFailedAction<NormalizedResponse>) {
  // At this point in the flow the request flow (APISuccessOrFailedAction), the users may or may not be in the store yet
  // (via WrapperRequestActionSuccess). Therefore in order to avoid partial entities we need to stick the whole user set into the store
  // including `missingRoles`.
  const usersInResponse: IRequestEntityTypeState<APIResource<CfUser>> = action.response.entities[cfUserEntityType];
  if (!usersInResponse) {
    return users;
  }

  // The GetAllOrgUsers request should contain the required roles, if not ignore this action (this will occur when we're fetching total
  // number of users in org and junking the result)
  const getOrgUsersAction: GetAllOrgUsers = action.apiAction as GetAllOrgUsers;
  const requiredRelations = createDefaultUserRelations();
  const hasRequiredRelations = requiredRelations.reduce((reqRels, rel) => {
    if (getOrgUsersAction.includeRelations.find(includedRel => includedRel === rel)) {
      reqRels.push(rel);
    }
    return reqRels;
  }, []).length === requiredRelations.length;
  if (!hasRequiredRelations) {
    return users;
  }

  // Create a delta of the changes, this will ensure we only return an updated state if there are updates
  const haveUpdatedUsers: boolean = Object.values(usersInResponse).reduce((changes, user) => {
    const oldMissingRoles = (users[user.metadata.guid] ? users[user.metadata.guid].entity.missingRoles : null)
      || getDefaultCfUserMissingRoles();
    const newMissingRoles = getDefaultCfUserMissingRoles();
    Object.values(CfUserRoleParams).forEach((roleParam) => {
      if (user.entity[roleParam]) {
        return;
      }
      // What's with all the `as`? Typing fun...
      if (isOrgRole(roleParam) ? oldMissingRoles.org.indexOf(roleParam as CfUserMissingOrgRoles) < 0 :
        oldMissingRoles.space.indexOf(roleParam as CfUserMissingSpaceRoles) < 0) {
        if (isOrgRole(roleParam)) {
          newMissingRoles.org.push(roleParam as CfUserMissingOrgRoles);
        } else {
          newMissingRoles.space.push(roleParam as CfUserMissingSpaceRoles);
        }
      }
    });
    user.entity.missingRoles = newMissingRoles;
    return changes || !!newMissingRoles.org.length || !!newMissingRoles.space.length;
  }, false);

  return haveUpdatedUsers ? deepMergeState(users, usersInResponse) : users;
}

function isOrgRole(role: string) {
  return role === CfUserRoleParams.AUDITED_ORGS ||
    role === CfUserRoleParams.BILLING_MANAGER_ORGS ||
    role === CfUserRoleParams.MANAGED_ORGS ||
    role === CfUserRoleParams.ORGANIZATIONS;
}
