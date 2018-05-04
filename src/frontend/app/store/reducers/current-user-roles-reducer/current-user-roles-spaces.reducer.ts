import { GetUserRelationsComplete } from '../../actions/permissions.actions';
import { ISpacesRoleState } from '../../types/current-user-roles.types';
import { currentUserSpaceRoleReducer } from './current-user-roles-space.reducer';

export function currentUserSpaceRolesReducer(state: ISpacesRoleState = {}, action: GetUserRelationsComplete) {
  return action.data.reduce((currentState, data) => {
    return {
      ...currentState,
      [data.metadata.guid]: currentUserSpaceRoleReducer(currentState[data.metadata.guid], action.relationType, !!action.data.length)
    };
  }, state);
}
