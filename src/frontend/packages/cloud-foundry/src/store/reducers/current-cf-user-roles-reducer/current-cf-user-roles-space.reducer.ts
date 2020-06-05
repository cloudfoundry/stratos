import { APIResource } from '../../../../../store/src/types/api.types';
import { CfUserRelationTypes } from '../../../actions/permissions.actions';
import { ISpace } from '../../../cf-api.types';
import { ISpaceRoleState } from '../../types/cf-current-user-roles.types';

export const defaultCfUserSpaceRoleState: ISpaceRoleState = {
  orgId: null,
  isManager: false,
  isAuditor: false,
  isDeveloper: false,
};

export function currentCfUserSpaceRoleReducer(
  state: ISpaceRoleState = defaultCfUserSpaceRoleState,
  relationType: CfUserRelationTypes,
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
  state: ISpaceRoleState = defaultCfUserSpaceRoleState,
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
  relationType: CfUserRelationTypes,
  userHasRelation: boolean
) {
  switch (relationType) {
    case CfUserRelationTypes.AUDITED_SPACES:
      return {
        ...state,
        isAuditor: userHasRelation
      };
    case CfUserRelationTypes.MANAGED_SPACES:
      return {
        ...state,
        isManager: userHasRelation
      };
    case CfUserRelationTypes.SPACES:
      return {
        ...state,
        isDeveloper: userHasRelation
      };
  }
  return state;
}
