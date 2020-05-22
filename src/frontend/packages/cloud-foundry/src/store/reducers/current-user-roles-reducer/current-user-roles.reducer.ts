import { Action } from '@ngrx/store';

import { SESSION_VERIFIED, VerifiedSession } from '../../../../../store/src/actions/auth.actions';
import {
  CONNECT_ENDPOINTS_SUCCESS,
  DISCONNECT_ENDPOINTS_SUCCESS,
  EndpointActionComplete,
  REGISTER_ENDPOINTS_SUCCESS,
  UNREGISTER_ENDPOINTS_SUCCESS,
} from '../../../../../store/src/actions/endpoint.actions';
import { EntityUserRolesReducer } from '../../../../../store/src/entity-request-pipeline/entity-request-pipeline.types';
import {
  roleInfoFromSessionReducer,
  updateNewlyConnectedEndpoint,
} from '../../../../../store/src/reducers/current-user-roles-reducer/current-user-role-session.reducer';
import {
  currentUserRolesRequestStateReducer,
  RolesRequestStateStage,
} from '../../../../../store/src/reducers/current-user-roles-reducer/current-user-roles.reducer';
import { APISuccessOrFailedAction } from '../../../../../store/src/types/request.types';
import { DELETE_ORGANIZATION_SUCCESS } from '../../../actions/organization.actions';
import {
  GET_CURRENT_USER_CF_RELATIONS,
  GET_CURRENT_USER_CF_RELATIONS_FAILED,
  GET_CURRENT_USER_CF_RELATIONS_SUCCESS,
  GET_CURRENT_USER_RELATION_SUCCESS,
  GetCurrentUserRelationsComplete,
  GetUserCfRelations,
} from '../../../actions/permissions.actions';
import { DELETE_SPACE_SUCCESS } from '../../../actions/space.actions';
import { ADD_ROLE_SUCCESS, REMOVE_ROLE_SUCCESS } from '../../../actions/users.actions';
import { IAllCfRolesState } from '../../types/cf-current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-user-base-cf-role.reducer';
import { updateAfterRoleChange } from './current-user-roles-changed.reducers';
import { addEndpoint, removeEndpointRoles, removeOrgRoles, removeSpaceRoles } from './current-user-roles-clear.reducers';

// TODO: RC TUESDAY HERE


// TODO: RC go through each, where are they?
// TODO: RC RENAME
export const currentCfUserRolesReducer: EntityUserRolesReducer = <IAllCfRolesState>(
  state: IAllCfRolesState,
  action: Action
): IAllCfRolesState => {
  switch (action.type) {
    case GET_CURRENT_USER_RELATION_SUCCESS: // TODO: RC  CF Only. VS GET_CURRENT_USER_CF_RELATIONS
      return {
        ...state,
        cf: currentUserBaseCFRolesReducer(state, action as GetCurrentUserRelationsComplete)
      };
    case SESSION_VERIFIED:// TODO: RC  CF Only
      return roleInfoFromSessionReducer(state, action as VerifiedSession);
    case REGISTER_ENDPOINTS_SUCCESS:// TODO: RC  CF Only
      return addEndpoint(state, action as EndpointActionComplete);
    case CONNECT_ENDPOINTS_SUCCESS:// TODO: RC  CF Only
      return updateNewlyConnectedEndpoint(state, action as EndpointActionComplete);
    case DISCONNECT_ENDPOINTS_SUCCESS:// TODO: RC  CF Only
    case UNREGISTER_ENDPOINTS_SUCCESS:// TODO: RC  CF Only
      return removeEndpointRoles(state, action as EndpointActionComplete);
    case DELETE_ORGANIZATION_SUCCESS:// TODO: RC  CF Only
      return removeOrgRoles(state, action as APISuccessOrFailedAction);
    case DELETE_SPACE_SUCCESS:// TODO: RC  CF Only
      return removeSpaceRoles(state, action as APISuccessOrFailedAction);
    case ADD_ROLE_SUCCESS:// TODO: RC  CF Only
      return updateAfterRoleChange(state, true, action as APISuccessOrFailedAction);
    case REMOVE_ROLE_SUCCESS:// TODO: RC  CF Only
      return updateAfterRoleChange(state, false, action as APISuccessOrFailedAction);
    case GET_CURRENT_USER_CF_RELATIONS:// TODO: RC  CF Only
    case GET_CURRENT_USER_CF_RELATIONS_SUCCESS:
    case GET_CURRENT_USER_CF_RELATIONS_FAILED:
      return {
        ...state,
        cf: currentUserCfRolesRequestStateReducer(state.cf, action as GetUserCfRelations)
      };
  }
  return null;
}

export function currentUserCfRolesRequestStateReducer(cf: IAllCfRolesState = {}, action: GetUserCfRelations) {
  const cfGuid = (action as GetUserCfRelations).cfGuid;

  const type = action.type === GET_CURRENT_USER_CF_RELATIONS ?
    RolesRequestStateStage.START :
    action.type === GET_CURRENT_USER_CF_RELATIONS_SUCCESS ? RolesRequestStateStage.SUCCESS :
      action.type === GET_CURRENT_USER_CF_RELATIONS_FAILED ? RolesRequestStateStage.FAILURE :
        RolesRequestStateStage.OTHER
  return {
    ...cf,
    [cfGuid]: {
      ...cf[cfGuid],
      state: {
        ...cf[cfGuid].state,
        ...currentUserRolesRequestStateReducer(cf[cfGuid].state, type)
      }
    }
  };
}
