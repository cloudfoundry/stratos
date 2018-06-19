import { ScopeStrings } from '../../../core/current-user-permissions.config';
import { VerifiedSession } from '../../actions/auth.actions';
import { EndpointActionComplete } from '../../actions/endpoint.actions';
import { SessionUser } from '../../types/auth.types';
import {
  getDefaultEndpointRoles,
  IAllCfRolesState,
  ICfRolesState,
  ICurrentUserRolesState,
  IGlobalRolesState,
} from '../../types/current-user-roles.types';
import { EndpointUser, INewlyConnectedEndpointInfo } from '../../types/endpoint.types';

interface PartialEndpoint {
  user: EndpointUser | SessionUser;
  guid: string;
}

export function roleInfoFromSessionReducer(
  state: ICurrentUserRolesState,
  action: VerifiedSession
): ICurrentUserRolesState {
  const { user, endpoints } = action.sessionData;
  const cfRoles = propagateEndpointsAdminPermissions(state.cf, Object.values(endpoints.cf));
  return applyInternalScopes(state, cfRoles, user);
}

export function updateNewlyConnectedEndpoint(
  state: ICurrentUserRolesState,
  action: EndpointActionComplete
): ICurrentUserRolesState {
  if (action.endpointType !== 'cf') {
    return state;
  }
  const endpoint = action.endpoint as INewlyConnectedEndpointInfo;
  const cfRoles = propagateEndpointsAdminPermissions(state.cf, [{
    user: endpoint.user,
    guid: action.guid
  }]);
  return {
    ...state,
    cf: cfRoles
  };
}

function applyInternalScopes(state: ICurrentUserRolesState, cfRoles: IAllCfRolesState, user?: SessionUser | EndpointUser) {
  const internalRoles = { ...state.internal };
  if (user) {
    internalRoles.scopes = user.scopes || [];
    // The admin scope is configurable - so look at the flag provided by the backend
    internalRoles.isAdmin = user.admin;
  }

  return {
    ...state,
    cf: cfRoles,
    internal: internalRoles
  };
}

function propagateEndpointsAdminPermissions(
  cfState: IAllCfRolesState,
  endpoints: PartialEndpoint[]
): IAllCfRolesState {
  return Object.values(endpoints).reduce((state, endpoint) => {
    return {
      ...state,
      [endpoint.guid]: propagateEndpointAdminPermissions(state[endpoint.guid], endpoint)
    };
  }, { ...cfState });
}

function propagateEndpointAdminPermissions(state: ICfRolesState = getDefaultEndpointRoles(), endpoint: PartialEndpoint) {
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

