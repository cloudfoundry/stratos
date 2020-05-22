import { Action } from '@ngrx/store';

import {
  GET_CURRENT_USER_RELATIONS,
  GET_CURRENT_USER_RELATIONS_FAILED,
  GET_CURRENT_USER_RELATIONS_SUCCESS,
} from '../../actions/permissions.actions';
import { entityCatalog } from '../../entity-catalog/entity-catalog';
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
  switch (action.type) {
    case GET_CURRENT_USER_RELATIONS:// TODO: RC NOT CF!!!!!!!!!!!! but has in
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.START)
      };
    case GET_CURRENT_USER_RELATIONS_SUCCESS:// TODO: RC NOT CF!!!!!!!!!!!! but has in
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.SUCCESS)
      };
    case GET_CURRENT_USER_RELATIONS_FAILED:// TODO: RC NOT CF!!!!!!!!!!!! but has in
      return {
        ...state,
        state: currentUserRolesRequestStateReducer(state.state, RolesRequestStateStage.FAILURE)
      };
    default: {
      // TODO: RC Comment. can cause issues if plugins have same action type names. Should use same method as 
      // requestData in entity-catalog.module 
      return {
        ...state,
        ...entityCatalog.getAllCurrentUserReducers(state, action)
      };
    }
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
