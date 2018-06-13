import { UserRelationTypes } from '../../actions/permissions.actions';
import { IOrgRoleState } from '../../types/current-user-roles.types';

const defaultOrgRoleStateState = {
  isManager: false,
  isAuditor: false,
  isBillingManager: false,
  isUser: false,
  spaceGuids: []
};

export const createOrgRoleStateState = () => ({
  ...defaultOrgRoleStateState,
  spaceGuids: [
    ...defaultOrgRoleStateState.spaceGuids
  ]
});

export function currentUserOrgRoleReducer(
  state: IOrgRoleState = createOrgRoleStateState(),
  relationType: UserRelationTypes,
  userHasRelation: boolean
) {
  switch (relationType) {
    case UserRelationTypes.AUDITED_ORGANIZATIONS:
      return {
        ...state,
        isAuditor: userHasRelation
      };
    case UserRelationTypes.BILLING_MANAGED_ORGANIZATION:
      return {
        ...state,
        isBillingManager: userHasRelation
      };
    case UserRelationTypes.MANAGED_ORGANIZATION:
      return {
        ...state,
        isManager: userHasRelation
      };
    case UserRelationTypes.ORGANIZATIONS:
      return {
        ...state,
        isUser: userHasRelation
      };
  }
  return state;
}
