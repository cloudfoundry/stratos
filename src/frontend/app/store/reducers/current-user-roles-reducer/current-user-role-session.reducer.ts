import { VerifiedSession } from '../../actions/auth.actions';
import { ICurrentUserRolesState, IAllCfRolesState, ICfRolesState, getDefaultEndpointRoles } from '../../types/current-user-roles.types';
import { SessionData, SessionDataEndpoint } from '../../types/auth.types';

export function roleInfoFromSessionReducer(state: ICurrentUserRolesState, action: VerifiedSession): ICurrentUserRolesState {
  const { sessionData } = action;
  const cfRoles = propagateEndpointsAdminPermissions(state.cf, sessionData);
  const internalRoles = { ...state.internal };
  internalRoles.isAdmin = sessionData.user.admin;
  return {
    ...state,
    cf: cfRoles,
    internal: internalRoles
  };
}

function propagateEndpointsAdminPermissions(cfState: IAllCfRolesState, sessionData: SessionData): IAllCfRolesState {
  return Object.values(sessionData.endpoints.cf).reduce((state, endpoint) => {
    return {
      ...state,
      [endpoint.guid]: propagateEndpointAdminPermissions(state[endpoint.guid], endpoint)
    };
  }, { ...cfState });
}

function propagateEndpointAdminPermissions(state: ICfRolesState = getDefaultEndpointRoles(), endpoint: SessionDataEndpoint) {
  return {
    ...state,
    global: {
      ...state.global,
      isAdmin: endpoint.user ? endpoint.user.admin : false
    }
  };
}

