import { currentUserCFRolesReducer } from './current-user-cf-roles.reducer';
import { ICurrentUserRolesState, getDefaultEndpointRoles, IAllCfRolesState } from '../../types/current-user-roles.types';
import { GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';

export function currentUserBaseCFRolesReducer(state: IAllCfRolesState = {}, action: GetCurrentUserRelationsComplete): IAllCfRolesState {
  if (!state[action.endpointGuid]) {
    state = {
      ...state,
      [action.endpointGuid]: getDefaultEndpointRoles()
    };
  }
  return {
    ...state,
    [action.endpointGuid]: currentUserCFRolesReducer(state[action.endpointGuid], action)
  };
}
