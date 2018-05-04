import { ISpacesRoleState, IOrgsRoleState } from '../../types/current-user-roles.types';
import { GetUserRelationsComplete } from '../../actions/permissions.actions';
import { currentUserOrgRoleReducer } from './current-user-roles-org.reducer';

export function currentUserOrgRolesReducer(state: IOrgsRoleState = {}, action: GetUserRelationsComplete) {
  console.log('here');
  return action.data.reduce((currentState, data) => {
    return {
      ...currentState,
      [data.metadata.guid]: currentUserOrgRoleReducer(currentState[data.metadata.guid], action.relationType, !!action.data.length)
    };
  }, state);
}
