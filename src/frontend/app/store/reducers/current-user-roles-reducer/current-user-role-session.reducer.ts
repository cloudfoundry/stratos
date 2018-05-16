import { VerifiedSession } from '../../actions/auth.actions';
import {
  ICurrentUserRolesState,
  IAllCfRolesState,
  ICfRolesState,
  getDefaultEndpointRoles,
  IStratosRolesState,
  IGlobalRolesState
} from '../../types/current-user-roles.types';
import { SessionData, SessionDataEndpoint, SessionEndpoints, SessionUser } from '../../types/auth.types';
import { ScopeStrings } from '../../../core/current-user-permissions.config';

export function roleInfoFromSessionReducer(
  state: ICurrentUserRolesState,
  user: SessionUser,
  endpoints: SessionEndpoints
): ICurrentUserRolesState {
  const cfRoles = propagateEndpointsAdminPermissions(state.cf, endpoints);
  const internalRoles = { ...state.internal };
  if (user) {
    internalRoles.scopes = user.scopes || [];
    const isAdmin = internalRoles.scopes.includes(ScopeStrings.STRATOS_ADMIN);
    internalRoles.isAdmin = isAdmin;
  }
  return {
    ...state,
    cf: cfRoles,
    internal: internalRoles
  };
}

function propagateEndpointsAdminPermissions(cfState: IAllCfRolesState, endpoints: SessionEndpoints): IAllCfRolesState {
  return Object.values(endpoints.cf).reduce((state, endpoint) => {
    return {
      ...state,
      [endpoint.guid]: propagateEndpointAdminPermissions(state[endpoint.guid], endpoint)
    };
  }, { ...cfState });
}

function propagateEndpointAdminPermissions(state: ICfRolesState = getDefaultEndpointRoles(), endpoint: SessionDataEndpoint) {
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
    if (scope === ScopeStrings.CF_ADMIN_GROUP) {
      roles.isAdmin = true;
    }
    if (scope === ScopeStrings.CF_READ_ONLY_ADMIN_GROUP) {
      roles.isReadOnlyAdmin = true;
    }
    if (scope === ScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP) {
      roles.isGlobalAuditor = true;
    }
    if (scope === ScopeStrings.CF_READ_SCOPE) {
      roles.canRead = true;
    }
    if (scope === ScopeStrings.CF_WRITE_SCOPE) {
      roles.canWrite = true;
    }
    return roles;
  }, newEndpointState);
}

