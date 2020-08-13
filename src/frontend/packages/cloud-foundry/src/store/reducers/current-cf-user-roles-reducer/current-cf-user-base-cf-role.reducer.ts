import { APIResource } from '../../../../../store/src/types/api.types';
import { getDefaultRolesRequestState } from '../../../../../store/src/types/current-user-roles.types';
import { CfUserRelationTypes, GetCurrentCfUserRelationsComplete } from '../../../actions/permissions.actions';
import { ISpace } from '../../../cf-api.types';
import { IAllCfRolesState, ICfRolesState, IOrgsRoleState } from '../../types/cf-current-user-roles.types';
import { createCfOrgRoleStateState } from './current-cf-user-roles-org.reducer';
import { currentCfUserOrgRolesReducer } from './current-cf-user-roles-orgs.reducer';
import { currentCfUserSpaceRolesReducer } from './current-cf-user-roles-spaces.reducer';

export function getDefaultCfEndpointRoles(): ICfRolesState {
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

export function currentUserBaseCFRolesReducer(state: IAllCfRolesState = {}, action: GetCurrentCfUserRelationsComplete): IAllCfRolesState {
  if (!state[action.endpointGuid]) {
    state = {
      ...state,
      [action.endpointGuid]: getDefaultCfEndpointRoles()
    };
  }
  return {
    ...state,
    [action.endpointGuid]: currentUserCFRolesReducer(state[action.endpointGuid], action)
  };
}

function currentUserCFRolesReducer(
  state: ICfRolesState = getDefaultCfEndpointRoles(),
  action: GetCurrentCfUserRelationsComplete): ICfRolesState {
  if (isOrgRelation(action.relationType)) {
    return {
      ...state,
      organizations: currentCfUserOrgRolesReducer(state.organizations, action)
    };
  }
  if (isSpaceRelation(action.relationType)) {
    return {
      ...state,
      spaces: currentCfUserSpaceRolesReducer(state.spaces, action),
      organizations: assignSpaceToOrg(state.organizations, action.data)
    };
  }
  return state;
}

function assignSpaceToOrg(organizations: IOrgsRoleState = {}, spaces: APIResource<ISpace>[]): IOrgsRoleState {
  return spaces.reduce((newOrganizations: IOrgsRoleState, space) => {
    const orgGuid = space.entity.organization_guid;
    const org = newOrganizations[orgGuid] || createCfOrgRoleStateState();
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


function isOrgRelation(relationType: CfUserRelationTypes) {
  return relationType === CfUserRelationTypes.AUDITED_ORGANIZATIONS ||
    relationType === CfUserRelationTypes.BILLING_MANAGED_ORGANIZATION ||
    relationType === CfUserRelationTypes.MANAGED_ORGANIZATION ||
    relationType === CfUserRelationTypes.ORGANIZATIONS;
}

function isSpaceRelation(relationType: CfUserRelationTypes) {
  return relationType === CfUserRelationTypes.AUDITED_SPACES ||
    relationType === CfUserRelationTypes.MANAGED_SPACES ||
    relationType === CfUserRelationTypes.SPACES;
}
