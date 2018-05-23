import { Action } from '@ngrx/store';

import { GET_CURRENT_USER_RELATION_SUCCESS, GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';
import { ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-user-base-cf-role.reducer';
import { VerifiedSession, SESSION_VERIFIED } from '../../actions/auth.actions';
import { roleInfoFromSessionReducer } from './current-user-role-session.reducer';
import { DISCONNECT_ENDPOINTS_SUCCESS, DisconnectEndpoint, UNREGISTER_ENDPOINTS_SUCCESS } from '../../actions/endpoint.actions';
import { removeEndpointRoles, removeOrgRoles, removeSpaceRoles } from './current-user-roles-clear.reducers';
import { DELETE_ORGANIZATION_SUCCESS } from '../../actions/organization.actions';
import { APISuccessOrFailedAction } from '../../types/request.types';
import { DELETE_SPACE_SUCCESS } from '../../actions/space.actions';

const defaultState = {
  internal: {
    isAdmin: false,
    scopes: []
  },
  cf: {}
};

export function currentUserRolesReducer(state: ICurrentUserRolesState = defaultState, action: Action) {
  switch (action.type) {
    case GET_CURRENT_USER_RELATION_SUCCESS:
      return {
        ...state,
        cf: currentUserBaseCFRolesReducer(state.cf, action as GetCurrentUserRelationsComplete)
      };
    case SESSION_VERIFIED:
      const verifiedSession = action as VerifiedSession;
      return roleInfoFromSessionReducer(state, verifiedSession.sessionData.user, verifiedSession.sessionData.endpoints);
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      return removeEndpointRoles(state, action as DisconnectEndpoint);
    case DELETE_ORGANIZATION_SUCCESS:
      return removeOrgRoles(state, action as APISuccessOrFailedAction);
    case DELETE_SPACE_SUCCESS:
      return removeSpaceRoles(state, action as APISuccessOrFailedAction);
  }
  return state;
}
