import { Action } from '@ngrx/store';

import { DELETE_ORGANIZATION_SUCCESS } from '../../../../cloud-foundry/src/actions/organization.actions';
import {
  GET_CURRENT_USER_CF_RELATIONS,
  GET_CURRENT_USER_CF_RELATIONS_FAILED,
  GET_CURRENT_USER_CF_RELATIONS_SUCCESS,
  GET_CURRENT_USER_RELATION_SUCCESS,
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
  GetCurrentUserRelationsComplete,
  GetUserCfRelations,
} from '../../../../cloud-foundry/src/actions/permissions.actions';
import { DELETE_SPACE_SUCCESS } from '../../../../cloud-foundry/src/actions/space.actions';
import { ADD_ROLE_SUCCESS, REMOVE_ROLE_SUCCESS } from '../../../../cloud-foundry/src/actions/users.actions';
import {
  currentUserBaseCFRolesReducer,
} from '../../../../cloud-foundry/src/store/reducers/current-user-roles-reducer/current-user-base-cf-role.reducer';
import {
  updateAfterRoleChange,
} from '../../../../cloud-foundry/src/store/reducers/current-user-roles-reducer/current-user-roles-changed.reducers';
import { SESSION_VERIFIED, VerifiedSession } from '../../actions/auth.actions';
import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  EndpointActionComplete,
  REGISTER_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../actions/endpoint.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { getDefaultRolesRequestState, ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { APISuccessOrFailedAction } from '../../types/request.types';
import {
  currentUserCfRolesRequestStateReducer,
  currentUserRolesRequestStateReducer,
} from './current-user-request-state.reducers';
import { roleInfoFromSessionReducer, updateNewlyConnectedEndpoint } from './current-user-role-session.reducer';
import { addEndpoint, removeEndpointRoles, removeOrgRoles, removeSpaceRoles } from './current-user-roles-clear.reducers';

const getDefaultState = () => ({
  internal: {
    isAdmin: false,
    scopes: []
  },
  cf: {},
  state: getDefaultRolesRequestState()
});

export function currentUserRolesReducer(state: ICurrentUserRolesState = getDefaultState(), action: Action): ICurrentUserRolesState {
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
    case ADD_ROLE_SUCCESS:
      return updateAfterRoleChange(state, true, action as APISuccessOrFailedAction);
    case REMOVE_ROLE_SUCCESS:
      return updateAfterRoleChange(state, false, action as APISuccessOrFailedAction);
    case GET_CURRENT_USER_RELATIONS:
    case GET_CURRENT_USER_RELATIONS_SUCCESS:
    case GET_CURRENT_USER_RELATIONS_FAILED:
      // TODO: RC Comment. can cause issues if plugins have same action type names. Should use same method as 
      // requestData in entity-catalog.module 
      entityCatalog.getAllCurrentUserReducers();
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, action.type)
      };
    case GET_CURRENT_USER_CF_RELATIONS:
    case GET_CURRENT_USER_CF_RELATIONS_SUCCESS:
    case GET_CURRENT_USER_CF_RELATIONS_FAILED:
      return {
        ...state,
        cf: currentUserCfRolesRequestStateReducer(state.cf, action as GetUserCfRelations)
      };
  }
  return state;
}
