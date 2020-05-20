import { APIResource } from '../../../../../store/src/types/api.types';
import { getDefaultEndpointRoles } from '../../../../../store/src/types/current-user-roles.types';
import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../../actions/permissions.actions';
import { ISpace } from '../../../cf-api.types';
import { ICfRolesState, IOrgsRoleState } from '../../types/cf-current-user-roles.types';
import { createOrgRoleStateState } from './current-user-roles-org.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';

export function currentUserCFRolesReducer(
  state: ICfRolesState = getDefaultEndpointRoles(),
  action: GetCurrentUserRelationsComplete): ICfRolesState {
  if (isOrgRelation(action.relationType)) {
    return {
      ...state,
      organizations: currentUserOrgRolesReducer(state.organizations, action)
    };
  }
  if (isSpaceRelation(action.relationType)) {
    return {
      ...state,
      spaces: currentUserSpaceRolesReducer(state.spaces, action),
      organizations: assignSpaceToOrg(state.organizations, action.data)
    };
  }
  return state;
}

function assignSpaceToOrg(organizations: IOrgsRoleState = {}, spaces: APIResource<ISpace>[]): IOrgsRoleState {
  return spaces.reduce((newOrganizations: IOrgsRoleState, space) => {
    const orgGuid = space.entity.organization_guid;
    const org = newOrganizations[orgGuid] || createOrgRoleStateState();
    const spaceGuids = org.spaceGuids || [];
    if (spaceGuids.includes(space.metadata.guid)) {
      return newOrganizations;
    }
    return {
      ...newOrganizations,
      [orgGuid]: {
        ...org,
        spaceGuids: [
          ...spaceGuids,
          space.metadata.guid
        ]
      }
    };
  }, organizations);
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
