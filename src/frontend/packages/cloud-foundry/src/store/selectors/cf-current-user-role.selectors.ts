import { compose } from '@ngrx/store';

import { PermissionValues } from '../../../../core/src/core/permissions/current-user-permissions.config';
import {
  selectCurrentUserGlobalHasScopes,
  selectCurrentUserRolesState,
} from '../../../../store/src/selectors/current-user-role.selectors';
import { ICurrentUserRolesState } from '../../../../store/src/types/current-user-roles.types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { CfPermissionStrings, CfScopeStrings } from '../../user-permissions/cf-user-permissions-checkers';
import {
  IAllCfRolesState,
  ICfRolesState,
  IGlobalRolesState,
  IOrgsRoleState,
  ISpacesRoleState,
} from '../types/cf-current-user-roles.types';


export const selectCurrentUserRequestState = (state: ICurrentUserRolesState | ICfRolesState) => state.state;

const selectSpaceWithRoleFromOrg = (role: CfPermissionStrings, orgId: string) => (state: ICfRolesState) => {
  if (!state) {
    return 'all';
  }
  const org = state.organizations[orgId];
  if (!org) {
    return 'all';
  }
  const { spaces } = state;
  const { spaceGuids } = org;
  return spaceGuids.reduce((array: string[], spaceGuid: string) => {
    const space = spaces[spaceGuid];
    if (space && space[role]) {
      array.push(spaceGuid);
    }
    return array;
  }, []);
};

export const selectCurrentUserCFRolesState = (state: ICurrentUserRolesState) => state.endpoints[CF_ENDPOINT_TYPE];
export const selectCurrentUserCFEndpointRolesState = (endpointGuid: string) =>
  (state: IAllCfRolesState) => state ? state[endpointGuid] : null;

export const selectCurrentUserCFGlobalRolesStates = (state: ICfRolesState) => state ? state.global : null;
export const selectCurrentUserCFGlobalRolesState = (role: PermissionValues) => (state: IGlobalRolesState) => state[role] || false;
export const selectCurrentUserCFOrgsRolesState = (state: ICfRolesState) => state.organizations;
export const selectCurrentUserCFSpacesRolesState = (state: ICfRolesState) => state.spaces;
export const selectCurrentUserCFGlobalScopesState = (state: IGlobalRolesState) => state ? state.scopes : [];

export const selectCurrentUserCFSpaceRolesState = (spaceId: string) => (state: ISpacesRoleState) => state[spaceId];
export const selectCurrentUserCFOrgRolesState = (orgId: string) => (state: IOrgsRoleState) => state[orgId];

// Top level cf endpoint role objects
// ============================
export const getCurrentUserCFRolesState = compose(
  selectCurrentUserCFRolesState,
  selectCurrentUserRolesState
);
// ============================

// Specific endpoint roles
// ============================
export const getCurrentUserCFEndpointRolesState = (endpointGuid: string) => compose(
  selectCurrentUserCFEndpointRolesState(endpointGuid),
  getCurrentUserCFRolesState,
);
// ============================

// CF Global roles
// ============================
export const getCurrentUserCFGlobalStates = (endpointGuid: string) => compose(
  selectCurrentUserCFGlobalRolesStates,
  getCurrentUserCFEndpointRolesState(endpointGuid)
);
// ============================

// CF Global role
// ============================
export const getCurrentUserCFGlobalState = (endpointGuid: string, role: PermissionValues) => compose(
  selectCurrentUserCFGlobalRolesState(role),
  getCurrentUserCFGlobalStates(endpointGuid)
);
// ============================

// CF Request state
// ============================
export const getCurrentUserCFRequestState = (endpointGuid: string) => compose(
  selectCurrentUserRequestState,
  getCurrentUserCFGlobalStates(endpointGuid)
);
// ============================

// Specific endpoint scopes
// ============================
export const getCurrentUserCFEndpointScopesState = (endpointGuid: string) => compose(
  selectCurrentUserCFGlobalScopesState,
  getCurrentUserCFGlobalStates(endpointGuid)
);
// ============================

// Has endpoint scopes
// ============================
export const getCurrentUserCFEndpointHasScope = (endpointGuid: string, scope: CfScopeStrings) => compose(
  selectCurrentUserGlobalHasScopes(scope),
  getCurrentUserCFEndpointScopesState(endpointGuid)
);
// ============================

// Top level orgs
// ============================
export const getCurrentUserCFOrgsRolesState = (endpointGuid: string) => compose(
  selectCurrentUserCFOrgsRolesState,
  getCurrentUserCFEndpointRolesState(endpointGuid)
);
// ============================

// Top level spaces
// ============================
export const getCurrentUserCFSpacesRolesState = (endpointGuid: string) => compose(
  selectCurrentUserCFSpacesRolesState,
  getCurrentUserCFEndpointRolesState(endpointGuid)
);
// ============================

// Specific space roles
// ============================
export const getCurrentUserCFSpaceRolesState = (endpointGuid: string, spaceId: string) => compose(
  selectCurrentUserCFSpaceRolesState(spaceId),
  getCurrentUserCFSpacesRolesState(endpointGuid)
);
// ============================

// Specific org roles
// ============================
export const getCurrentUserCFOrgRolesState = (endpointGuid: string, orgId: string) => compose(
  selectCurrentUserCFOrgRolesState(orgId),
  getCurrentUserCFOrgsRolesState(endpointGuid)
);
// ============================

// Get an array of space guid that have a particular role
// anf from a particular org
// ============================
export const getSpacesFromOrgWithRole = (endpointGuid: string, orgId: string, role: CfPermissionStrings) => compose(
  selectSpaceWithRoleFromOrg(role, orgId),
  getCurrentUserCFEndpointRolesState(endpointGuid)
);
// ============================



