import { CfUserRelationTypes } from '../../../actions/permissions.actions';
import { IOrgRoleState } from '../../types/cf-current-user-roles.types';

export const defaultCfUserOrgRoleState: IOrgRoleState = {
  isManager: false,
  isAuditor: false,
  isBillingManager: false,
  isUser: false,
  spaceGuids: []
};

export const createCfOrgRoleStateState = () => ({
  ...defaultCfUserOrgRoleState,
  spaceGuids: [
    ...defaultCfUserOrgRoleState.spaceGuids
  ]
});

export function currentCfUserOrgRoleReducer(
  state: IOrgRoleState = createCfOrgRoleStateState(),
  relationType: CfUserRelationTypes,
  userHasRelation: boolean
) {
  switch (relationType) {
    case CfUserRelationTypes.AUDITED_ORGANIZATIONS:
      return {
        ...state,
        isAuditor: userHasRelation
      };
    case CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION:
      return {
        ...state,
        isBillingManager: userHasRelation
      };
    case CfUserRelationTypes.MANAGED_ORGANIZATION:
      return {
        ...state,
        isManager: userHasRelation
      };
    case CfUserRelationTypes.ORGANIZATIONS:
      return {
        ...state,
        isUser: userHasRelation
      };
  }
  return state;
}
