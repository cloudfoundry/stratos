import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { ISpaceRoleState } from '../../types/current-user-roles.types';
import { APIResource } from '../../types/api.types';
import { ISpace } from '../../../core/cf-api.types';

const defaultState = {
  orgId: null,
  isManager: false,
  isAuditor: false,
  isDeveloper: false,
};

export function currentUserSpaceRoleReducer(
  state: ISpaceRoleState = defaultState,
  relationType: UserRelationTypes,
  userHasRelation: boolean,
  space: APIResource<ISpace>
): ISpaceRoleState {
  const idState = addId(
    state,
    space
  );
  return applyRoles(
    idState,
    relationType,
    userHasRelation
  );
}

function addId(
  state: ISpaceRoleState = defaultState,
  space: APIResource<ISpace>
) {
  if (!state.orgId) {
    return {
      ...state,
      orgId: space.entity.organization_guid
    };
  }
  return state;
}

function applyRoles(
  state: ISpaceRoleState,
  relationType: UserRelationTypes,
  userHasRelation: boolean
) {
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
