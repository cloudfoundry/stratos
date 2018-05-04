import { GetUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { getDefaultEndpointRoles, ICfRolesState } from '../../types/current-user-roles.types';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
const defaultState = {
  organizations: {

  },
  spaces: {

  },
  global: {
    isAdmin: false,
    isReadOnlyAdmin: false,
    isGlobalAuditor: false,
  }
};

export function currentUserCFRolesReducer(state: ICfRolesState = defaultState, action: GetUserRelationsComplete) {
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

function isOrgRelation(relationType: UserRelationTypes) {
  return relationType === UserRelationTypes.AUDITED_ORGANIZATIONS ||
    relationType === UserRelationTypes.BILLING_MANAGED_ORGANIZATION ||
    relationType === UserRelationTypes.MANAGED_ORGANIZATION ||
    relationType === UserRelationTypes.ORGANIZATIONS;
}

function isSpaceRelation(relationType: UserRelationTypes) {
  return relationType === UserRelationTypes.AUDITED_SPACES ||
    relationType === UserRelationTypes.MANAGED_SPACES ||
    relationType === UserRelationTypes.SPACES;
}
