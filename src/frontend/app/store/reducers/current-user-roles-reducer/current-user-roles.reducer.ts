import { Action } from '@ngrx/store';

import { SESSION_VERIFIED, VerifiedSession } from '../../actions/auth.actions';
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
} from '../../actions/permissions.actions';
import { getDefaultRolesRequestState, ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-user-base-cf-role.reducer';
import {
  currentUserCfRolesRequestStateReducer,
  currentUserRolesRequestStateReducer,
} from './current-user-request-state.reducers';
import { roleInfoFromSessionReducer } from './current-user-role-session.reducer';

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
      const verifiedSession = action as VerifiedSession;
      return roleInfoFromSessionReducer(state, verifiedSession.sessionData.user, verifiedSession.sessionData.endpoints);
    case GET_CURRENT_USER_RELATIONS:
    case GET_CURRENT_USER_RELATIONS_SUCCESS:
    case GET_CURRENT_USER_RELATIONS_FAILED:
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
