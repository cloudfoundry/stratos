import { UserRelationTypes } from '../../actions/permissions.actions';
import { IOrgRoleState } from '../../types/current-user-roles.types';

export const defaultUserOrgRoleState: IOrgRoleState = {
  isManager: false,
  isAuditor: false,
  isBillingManager: false,
  isUser: false,
  spaceGuids: []
};

export const createOrgRoleStateState = () => ({
  ...defaultUserOrgRoleState,
  spaceGuids: [
    ...defaultUserOrgRoleState.spaceGuids
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
