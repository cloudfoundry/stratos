import { Action } from '@ngrx/store';

import { SESSION_VERIFIED, VerifiedSession } from '../../actions/auth.actions';
import {
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
} from '../../actions/permissions.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
import { SessionUser } from '../../types/auth.types';
import {
  getDefaultRolesRequestState,
  ICurrentUserRolesState,
  RolesRequestState,
} from '../../types/current-user-roles.types';

const getDefaultState = () => ({
  internal: {
    isAdmin: false,
    scopes: []
  },
  endpoints: {},
  state: getDefaultRolesRequestState()
});

export function currentUserRolesReducer(state: ICurrentUserRolesState = getDefaultState(), action: Action): ICurrentUserRolesState {
  const stateAfterCoreChanges = coreCurrentUserRolesReducer(state, action);
  return entityCatalog.getAllCurrentUserReducers(stateAfterCoreChanges, action);
}

function coreCurrentUserRolesReducer(state: ICurrentUserRolesState, action: Action): ICurrentUserRolesState {
  switch (action.type) {
    case GET_CURRENT_USER_RELATIONS:
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.START)
      };
    case GET_CURRENT_USER_RELATIONS_SUCCESS:
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.SUCCESS)
      };
    case GET_CURRENT_USER_RELATIONS_FAILED:
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.FAILURE)
      };
    case SESSION_VERIFIED:
      const svAction = action as VerifiedSession
      return applyInternalScopes(state, svAction.sessionData.user);
  }
  return state;
}

export enum RolesRequestStateStage {
  START,
  SUCCESS,
  FAILURE,
  OTHER
}

export function currentUserRolesRequestStateReducer(state: RolesRequestState = getDefaultRolesRequestState(), stage: RolesRequestStateStage) {
  switch (stage) {
    case RolesRequestStateStage.START:
      return {
        ...state,
        fetching: true
      };
    case RolesRequestStateStage.SUCCESS:
      return {
        ...state,
        initialised: true,
        fetching: false
      };
    case RolesRequestStateStage.FAILURE:
      return {
        ...state,
        fetching: false,
        error: true
      };
  }
}

function applyInternalScopes(state: ICurrentUserRolesState, user: SessionUser): ICurrentUserRolesState {
  const internalRoles = { ...state.internal };
  if (user) {
    internalRoles.scopes = user.scopes || [];
    // The admin scope is configurable - so look at the flag provided by the backend
    internalRoles.isAdmin = user.admin;
  }

  return {
    ...state,
    internal: internalRoles
  };
}