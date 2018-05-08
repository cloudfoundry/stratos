import { ISpacesRoleState, IOrgsRoleState } from '../../types/current-user-roles.types';
import { GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';
import { currentUserOrgRoleReducer } from './current-user-roles-org.reducer';
import { addNewRoles, removeOldRoles } from './current-user-reducer.helpers';

export function currentUserOrgRolesReducer(state: IOrgsRoleState = {}, action: GetCurrentUserRelationsComplete) {
  const { newState, addedIds } = addNewRoles(state, action, currentUserOrgRoleReducer);
  return removeOldRoles(newState, action, addedIds, currentUserOrgRoleReducer);
}
