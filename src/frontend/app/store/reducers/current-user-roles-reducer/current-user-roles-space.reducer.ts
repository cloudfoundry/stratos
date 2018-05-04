import { GetUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { ISpaceRoleState } from '../../types/current-user-roles.types';

const defaultState = {
  isManager: false,
  isAuditor: false,
  isDeveloper: false,
};

export function currentUserSpaceRoleReducer(
  state: ISpaceRoleState = defaultState,
  relationType: UserRelationTypes,
  userHasRelation: boolean
): ISpaceRoleState {
  switch (relationType) {
    case UserRelationTypes.AUDITED_SPACES:
      return {
        ...state,
        isAuditor: userHasRelation
      };
    case UserRelationTypes.MANAGED_SPACES:
      return {
        ...state,
        isManager: userHasRelation
      };
    case UserRelationTypes.SPACES:
      return {
        ...state,
        isDeveloper: userHasRelation
      };
  }
  return state;
}
