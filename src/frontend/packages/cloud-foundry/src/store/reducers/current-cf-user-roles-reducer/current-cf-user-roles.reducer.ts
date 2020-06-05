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
  currentUserRolesRequestStateReducer,
  RolesRequestStateStage,
} from '../../../../../store/src/reducers/current-user-roles-reducer/current-user-roles.reducer';
import { APISuccessOrFailedAction } from '../../../../../store/src/types/request.types';
import { DELETE_ORGANIZATION_SUCCESS } from '../../../actions/organization.actions';
import {
  GET_CURRENT_CF_USER_RELATION_SUCCESS,
  GET_CURRENT_CF_USER_RELATIONS,
  GET_CURRENT_CF_USER_RELATIONS_FAILED,
  GET_CURRENT_CF_USER_RELATIONS_SUCCESS,
  GetCfUserRelations,
  GetCurrentCfUserRelationsComplete,
} from '../../../actions/permissions.actions';
import { DELETE_SPACE_SUCCESS } from '../../../actions/space.actions';
import { ADD_CF_ROLE_SUCCESS, REMOVE_CF_ROLE_SUCCESS } from '../../../actions/users.actions';
import { IAllCfRolesState } from '../../types/cf-current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-cf-user-base-cf-role.reducer';
import { cfRoleInfoFromSessionReducer, updateNewlyConnectedCfEndpoint } from './current-cf-user-role-session.reducer';
import { updateAfterCfRoleChange } from './current-cf-user-roles-changed.reducers';
import {
  addCfEndpoint,
  removeCfOrgRoles,
  removeCfSpaceRoles,
  removeEndpointCfRoles,
} from './current-cf-user-roles-clear.reducers';

export const currentCfUserRolesReducer: EntityUserRolesReducer<IAllCfRolesState> = (
  state: IAllCfRolesState = {},
  action: Action
): IAllCfRolesState => {
  switch (action.type) {
    case GET_CURRENT_CF_USER_RELATION_SUCCESS:
      const gcursAction = action as GetCurrentCfUserRelationsComplete
      return currentUserBaseCFRolesReducer(state, gcursAction);
    case SESSION_VERIFIED:
      return cfRoleInfoFromSessionReducer(state, action as VerifiedSession);
    case REGISTER_ENDPOINTS_SUCCESS:
      return addCfEndpoint(state, action as EndpointActionComplete);
    case CONNECT_ENDPOINTS_SUCCESS:
      return updateNewlyConnectedCfEndpoint(state, action as EndpointActionComplete);
    case DISCONNECT_ENDPOINTS_SUCCESS:
    case UNREGISTER_ENDPOINTS_SUCCESS:
      return removeEndpointCfRoles(state, action as EndpointActionComplete);
    case DELETE_ORGANIZATION_SUCCESS:
      return removeCfOrgRoles(state, action as APISuccessOrFailedAction);
    case DELETE_SPACE_SUCCESS:
      return removeCfSpaceRoles(state, action as APISuccessOrFailedAction);
    case ADD_CF_ROLE_SUCCESS:
      return updateAfterCfRoleChange(state, true, action as APISuccessOrFailedAction);
    case REMOVE_CF_ROLE_SUCCESS:
      return updateAfterCfRoleChange(state, false, action as APISuccessOrFailedAction);
    case GET_CURRENT_CF_USER_RELATIONS:
    case GET_CURRENT_CF_USER_RELATIONS_SUCCESS:
    case GET_CURRENT_CF_USER_RELATIONS_FAILED:
      return currentUserCfRolesRequestStateReducer(state, action as GetCfUserRelations);
  }
  return null;
}

export function currentUserCfRolesRequestStateReducer(cf: IAllCfRolesState = {}, action: GetCfUserRelations) {
  const cfGuid = (action as GetCfUserRelations).cfGuid;

  const type = action.type === GET_CURRENT_CF_USER_RELATIONS ?
    RolesRequestStateStage.START :
    action.type === GET_CURRENT_CF_USER_RELATIONS_SUCCESS ? RolesRequestStateStage.SUCCESS :
      action.type === GET_CURRENT_CF_USER_RELATIONS_FAILED ? RolesRequestStateStage.FAILURE :
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
