import { GetCurrentUserRelationsComplete } from '../../actions/permissions.actions';
import { APIResource } from '../../types/api.types';
import { getDefaultEndpointRoles, ICfRolesState, IOrgsRoleState } from '../../types/current-user-roles.types';
import { isOrgRelation, isSpaceRelation } from './current-user-reducer.helpers';
import { createOrgRoleStateState } from './current-user-roles-org.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';
import { ISpace } from '../../../../core/src/core/cf-api.types';

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
