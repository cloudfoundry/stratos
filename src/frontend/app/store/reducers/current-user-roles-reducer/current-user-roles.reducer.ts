import { Action } from '@ngrx/store';

import { GET_CURRENT_USER_RELATION_SUCCESS, GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';
import { ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-user-base-cf-role.reducer';
import { VerifiedSession, SESSION_VERIFIED } from '../../actions/auth.actions';
import { roleInfoFromSessionReducer, updateNewlyConnectedEndpoint } from './current-user-role-session.reducer';
import {
  DISCONNECT_ENDPOINTS_SUCCESS,
  DisconnectEndpoint,
  UNREGISTER_ENDPOINTS_SUCCESS,
  REGISTER_ENDPOINTS_SUCCESS,
  RegisterEndpoint,
  EndpointActionComplete,
  CONNECT_ENDPOINTS_SUCCESS
} from '../../actions/endpoint.actions';
import { removeEndpointRoles, addEndpoint, removeOrgRoles, removeSpaceRoles } from './current-user-roles-clear.reducers';
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

export function currentUserRolesReducer(state: ICurrentUserRolesState = defaultState, action: Action): ICurrentUserRolesState {
  switch (action.type) {
    case GET_CURRENT_USER_RELATION_SUCCESS:
      return {
        ...state,
        cf: currentUserBaseCFRolesReducer(state.cf, action as GetCurrentUserRelationsComplete)
      };
    case SESSION_VERIFIED:
      return roleInfoFromSessionReducer(state, action as VerifiedSession);
    case REGISTER_ENDPOINTS_SUCCESS:
      return addEndpoint(state, action as EndpointActionComplete);
    case CONNECT_ENDPOINTS_SUCCESS:
      return updateNewlyConnectedEndpoint(state, action as EndpointActionComplete);
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      return removeEndpointRoles(state, action as EndpointActionComplete);
    case DELETE_ORGANIZATION_SUCCESS:
      return removeOrgRoles(state, action as APISuccessOrFailedAction);
    case DELETE_SPACE_SUCCESS:
      return removeSpaceRoles(state, action as APISuccessOrFailedAction);
  }
  return state;
}
