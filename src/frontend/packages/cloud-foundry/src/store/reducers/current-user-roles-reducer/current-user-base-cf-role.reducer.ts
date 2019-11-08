import { getDefaultEndpointRoles } from '../../../../../store/src/types/current-user-roles.types';
import { GetCurrentUserRelationsComplete } from '../../../actions/permissions.actions';
import { IAllCfRolesState } from '../../types/cf-current-user-roles.types';
import { currentUserCFRolesReducer } from './current-user-cf-roles.reducer';

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
