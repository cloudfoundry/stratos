import {
  GET_CURRENT_USER_CF_RELATIONS,
  GET_CURRENT_USER_CF_RELATIONS_FAILED,
  GET_CURRENT_USER_CF_RELATIONS_SUCCESS,
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
  GetUserCfRelations,
} from '../../../actions/permissions.actions';
import { getDefaultRolesRequestState, IAllCfRolesState, RolesRequestState } from '../../../../../store/src/types/current-user-roles.types';

export function currentUserRolesRequestStateReducer(state: RolesRequestState = getDefaultRolesRequestState(), type: string) {
  switch (type) {
    case GET_CURRENT_USER_RELATIONS:
    case GET_CURRENT_USER_CF_RELATIONS:
      return {
        ...state,
        fetching: true
      };
    case GET_CURRENT_USER_RELATIONS_SUCCESS:
    case GET_CURRENT_USER_CF_RELATIONS_SUCCESS:
      return {
        ...state,
        initialised: true,
        fetching: false
      };
    case GET_CURRENT_USER_RELATIONS_FAILED:
    case GET_CURRENT_USER_CF_RELATIONS_FAILED:
      return {
        ...state,
        fetching: false,
        error: true
      };
  }
}

export function currentUserCfRolesRequestStateReducer(cf: IAllCfRolesState = {}, action: GetUserCfRelations) {
  const cfGuid = (action as GetUserCfRelations).cfGuid;
  return {
    ...cf,
    [cfGuid]: {
      ...cf[cfGuid],
      state: {
        ...cf[cfGuid].state,
        ...currentUserRolesRequestStateReducer(cf[cfGuid].state, action.type)
      }
    }
  };
}
