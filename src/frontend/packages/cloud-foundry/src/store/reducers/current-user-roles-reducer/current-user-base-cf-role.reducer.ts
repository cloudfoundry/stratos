import { GetCurrentUserRelationsComplete } from '../../../actions/permissions.actions';
import { currentUserCFRolesReducer } from './current-user-cf-roles.reducer';
import { IAllCfRolesState, getDefaultEndpointRoles } from '../../../../../store/src/types/current-user-roles.types';

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
