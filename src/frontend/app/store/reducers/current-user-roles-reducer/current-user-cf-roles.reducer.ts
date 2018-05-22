import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../actions/permissions.actions';
import { getDefaultEndpointRoles, ICfRolesState, IOrgsRoleState } from '../../types/current-user-roles.types';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
import { isOrgRelation, isSpaceRelation } from './current-user-reducer.helpers';
import { APIResource } from '../../types/api.types';
import { ISpace } from '../../../core/cf-api.types';

export function currentUserCFRolesReducer(state: ICfRolesState = getDefaultEndpointRoles(), action: GetCurrentUserRelationsComplete) {
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
function assignSpaceToOrg(organizations: IOrgsRoleState = {}, spaces: APIResource<ISpace>[]) {
  return spaces.reduce((newOrganizations, space) => {
    const orgGuid = space.entity.organization_guid;
    const spaceGuids = newOrganizations[orgGuid].spaceGuids || [];
    return spaceGuids.includes(space.metadata.guid) ? newOrganizations : {
      ...newOrganizations,
      [orgGuid]: {
        ...(newOrganizations[orgGuid] || {}),
        spaceGuids: [
          ...(newOrganizations[orgGuid].spaceGuids || []),
          space.metadata.guid
        ]
      }
    };
  }, organizations);
}
