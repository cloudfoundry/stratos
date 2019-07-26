import { GetCurrentUserRelationsComplete } from '../../../actions/permissions.actions';
import { IOrgsRoleState } from '../../types/cf-current-user-roles.types';
import { addNewRoles, removeOldRoles } from '../../../../../store/src/reducers/current-user-roles-reducer/current-user-reducer.helpers';
import { currentUserOrgRoleReducer } from './current-user-roles-org.reducer';

export function currentUserOrgRolesReducer(state: IOrgsRoleState = {}, action: GetCurrentUserRelationsComplete) {
  const { newState, addedIds } = addNewRoles(state, action, currentUserOrgRoleReducer);
  return removeOldRoles(newState, action, addedIds, currentUserOrgRoleReducer);
}
