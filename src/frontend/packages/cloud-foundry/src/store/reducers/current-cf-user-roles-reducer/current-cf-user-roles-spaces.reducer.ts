import { GetCurrentCfUserRelationsComplete } from '../../../actions/permissions.actions';
import { ISpacesRoleState } from '../../types/cf-current-user-roles.types';
import { addNewCfRoles, removeOldCfRoles } from './current-cf-user-reducer.helpers';
import { currentCfUserSpaceRoleReducer } from './current-cf-user-roles-space.reducer';

export function currentCfUserSpaceRolesReducer(state: ISpacesRoleState = {}, action: GetCurrentCfUserRelationsComplete) {
  const { newState, addedIds } = addNewCfRoles(state, action, currentCfUserSpaceRoleReducer);
  return removeOldCfRoles(newState, action, addedIds, currentCfUserSpaceRoleReducer);
}
