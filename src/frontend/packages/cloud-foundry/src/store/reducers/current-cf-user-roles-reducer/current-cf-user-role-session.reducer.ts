import { EndpointUser, SessionUser, VerifiedSession } from '@stratosui/store';

import { CfScopeStrings } from '../../../user-permissions/cf-user-permissions.types';
import { CfRoleEndpointConnectedAction } from '../../actions/cf-endpoint-role.actions';
import { IAllCfRolesState, ICfRolesState, IGlobalRolesState } from '../../types/cf-current-user-roles.types';
import { getDefaultCfEndpointRoles } from './current-cf-user-base-cf-role.reducer';

interface PartialEndpoint {
  user: EndpointUser | SessionUser;
  guid: string;
}

export function cfRoleInfoFromSessionReducer(
  state: IAllCfRolesState,
  action: VerifiedSession
): IAllCfRolesState {
  if (!action.sessionData || !action.sessionData.endpoints) {
    return state;
  }
  const { endpoints } = action.sessionData;
  return propagateEndpointsAdminPermissions(state, Object.values(endpoints.cf || {}));
}

export function updateNewlyConnectedCfEndpoint(
  state: IAllCfRolesState,
  action: CfRoleEndpointConnectedAction
): IAllCfRolesState {
  const cfRoles = propagateEndpointsAdminPermissions(state, [{
    user: action.user,
    guid: action.guid
  }]);
  return {
    ...cfRoles,
  };
}


function propagateEndpointsAdminPermissions(
  cfState: IAllCfRolesState,
  endpoints: PartialEndpoint[]
): IAllCfRolesState {
  if (!endpoints || !endpoints.length) {
    return cfState;
  }
  return Object.values(endpoints).reduce((state, endpoint) => {
    return {
      ...state,
      [endpoint.guid]: propagateEndpointAdminPermissions(state[endpoint.guid], endpoint)
    };
  }, { ...cfState });
}

function propagateEndpointAdminPermissions(state: ICfRolesState = getDefaultCfEndpointRoles(), endpoint: PartialEndpoint) {
  const scopes = endpoint.user ? endpoint.user.scopes : [];
  const global = getEndpointRoles(scopes, state.global);
  return {
    ...state,
    global
  };
}

function getEndpointRoles(scopes: string[], globalEndpointState: IGlobalRolesState) {
  const newEndpointState = {
    ...globalEndpointState,
    scopes
  };
  return scopes.reduce((roles, scope) => {
    if (scope === CfScopeStrings.CF_ADMIN_GROUP) {
      roles.isAdmin = true;
    }
    if (scope === CfScopeStrings.CF_READ_ONLY_ADMIN_GROUP) {
      roles.isReadOnlyAdmin = true;
    }
    if (scope === CfScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP) {
      roles.isGlobalAuditor = true;
    }
    if (scope === CfScopeStrings.CF_READ_SCOPE) {
      roles.canRead = true;
    }
    if (scope === CfScopeStrings.CF_WRITE_SCOPE) {
      roles.canWrite = true;
    }
    return roles;
  }, newEndpointState);
}

