import { Action } from '@ngrx/store';

import { GET_CURRENT_USER_RELATION_SUCCESS, GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';
import { ICurrentUserRolesState } from '../../types/current-user-roles.types';
import { currentUserBaseCFRolesReducer } from './current-user-base-cf-role.reducer';
import { VerifiedSession, SESSION_VERIFIED } from '../../actions/auth.actions';
import { roleInfoFromSessionReducer } from './current-user-role-session.reducer';

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
  }
  return state;
}
