import { GetCurrentUserRelationsComplete } from '../../../../cloud-foundry/src/actions/permissions.actions';
import { ISpacesRoleState } from '../../types/current-user-roles.types';
import { currentUserSpaceRoleReducer } from './current-user-roles-space.reducer';
import { addNewRoles, removeOldRoles } from './current-user-reducer.helpers';

export function currentUserSpaceRolesReducer(state: ISpacesRoleState = {}, action: GetCurrentUserRelationsComplete) {
  const { newState, addedIds } = addNewRoles(state, action, currentUserSpaceRoleReducer);
  return removeOldRoles(newState, action, addedIds, currentUserSpaceRoleReducer);
}


