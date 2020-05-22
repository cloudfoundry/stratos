import { VerifiedSession } from '../../../../../store/src/actions/auth.actions';
import { EndpointActionComplete } from '../../../../../store/src/actions/endpoint.actions';
import { SessionUser } from '../../../../../store/src/types/auth.types';
import { EndpointUser, INewlyConnectedEndpointInfo } from '../../../../../store/src/types/endpoint.types';
import { CfScopeStrings } from '../../../user-permissions/cf-user-permissions-checkers';
import { IAllCfRolesState, ICfRolesState, IGlobalRolesState } from '../../types/cf-current-user-roles.types';
import { getDefaultEndpointRoles } from '../../types/current-user-roles.types';

interface PartialEndpoint {
  user: EndpointUser | SessionUser;
  guid: string;
}

export function roleInfoFromSessionReducer(
  state: IAllCfRolesState,
  action: VerifiedSession
): IAllCfRolesState {
  const { user, endpoints } = action.sessionData;
  const cfRoles = propagateEndpointsAdminPermissions(state, Object.values(endpoints.cf));
  return applyInternalScopes(state, cfRoles, user);
}

export function updateNewlyConnectedEndpoint(
  state: IAllCfRolesState,
  action: EndpointActionComplete
): IAllCfRolesState {
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

// TODO: RC huh
function applyInternalScopes(state: IAllCfRolesState, cfRoles: IAllCfRolesState, user?: SessionUser | EndpointUser) {
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

