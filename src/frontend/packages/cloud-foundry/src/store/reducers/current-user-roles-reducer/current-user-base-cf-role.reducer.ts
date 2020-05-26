import { APIResource } from '../../../../../store/src/types/api.types';
import { getDefaultRolesRequestState } from '../../../../../store/src/types/current-user-roles.types';
import { GetCurrentUserRelationsComplete, UserRelationTypes } from '../../../actions/permissions.actions';
import { ISpace } from '../../../cf-api.types';
import { IAllCfRolesState, ICfRolesState, IOrgsRoleState } from '../../types/cf-current-user-roles.types';
import { createOrgRoleStateState } from './current-user-roles-org.reducer';
import { currentUserOrgRolesReducer } from './current-user-roles-orgs.reducer';
import { currentUserSpaceRolesReducer } from './current-user-roles-spaces.reducer';

// TODO: RC RENAME
export function getDefaultEndpointRoles(): ICfRolesState {
  return {
    global: {
      isAdmin: false,
      isReadOnlyAdmin: false,
      isGlobalAuditor: false,
      canRead: false,
      canWrite: false,
      scopes: []
    },
    spaces: {

    },
    organizations: {

    },
    state: getDefaultRolesRequestState()
  };
}

export function currentUserBaseCFRolesReducer(state: IAllCfRolesState = {}, action: GetCurrentUserRelationsComplete): IAllCfRolesState {
  if (!state[action.endpointGuid]) {
    state = {
      ...state,
      [action.endpointGuid]: getDefaultEndpointRoles()
    };
  }
  return {
    ...state,
    [action.endpointGuid]: currentUserCFRolesReducer(state[action.endpointGuid], action)
  };
}

function currentUserCFRolesReducer(
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
