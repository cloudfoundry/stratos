import { APIResource } from '../../../../../store/src/types/api.types';
import { UserRelationTypes } from '../../../actions/permissions.actions';
import { ISpace } from '../../../cf-api.types';
import { ISpaceRoleState } from '../../types/cf-current-user-roles.types';

export const defaultUserSpaceRoleState: ISpaceRoleState = {
  orgId: null,
  isManager: false,
  isAuditor: false,
  isDeveloper: false,
};

export function currentUserSpaceRoleReducer(
  state: ISpaceRoleState = defaultUserSpaceRoleState,
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
  state: ISpaceRoleState = defaultUserSpaceRoleState,
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
