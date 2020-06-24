import { GetCurrentCfUserRelationsComplete } from '../../../actions/permissions.actions';
import { IOrgsRoleState } from '../../types/cf-current-user-roles.types';
import { addNewCfRoles, removeOldCfRoles } from './current-cf-user-reducer.helpers';
import { currentCfUserOrgRoleReducer } from './current-cf-user-roles-org.reducer';

export function currentCfUserOrgRolesReducer(state: IOrgsRoleState = {}, action: GetCurrentCfUserRelationsComplete) {
  const { newState, addedIds } = addNewCfRoles(state, action, currentCfUserOrgRoleReducer);
  return removeOldCfRoles(newState, action, addedIds, currentCfUserOrgRoleReducer);
}
