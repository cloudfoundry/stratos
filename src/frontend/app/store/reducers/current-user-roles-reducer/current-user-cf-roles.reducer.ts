import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { getDefaultEndpointRoles, ICfRolesState } from '../../types/current-user-roles.types';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
import { isOrgRelation, isSpaceRelation } from './current-user-reducer.helpers';

export function currentUserCFRolesReducer(state: ICfRolesState = getDefaultEndpointRoles(), action: GetCurrentUserRelationsComplete) {
  if (isOrgRelation(action.relationType)) {
    return {
      ...state,
      organizations: currentUserOrgRolesReducer(state.organizations, action)
    };
  }
  if (isSpaceRelation(action.relationType)) {
    return {
      ...state,
      spaces: currentUserSpaceRolesReducer(state.spaces, action)
    };
  }
  return state;
}