import { compose } from '@ngrx/store';

import { AppState } from '../../app-state';
import {
  IAllCfRolesState,
  ICfRolesState,
  ICurrentUserRolesState,
  IOrgRoleState,
  ISpacesRoleState,
  IOrgsRoleState,
  IStratosRolesState,
  IGlobalRolesState,
} from '../../types/current-user-roles.types';
import { PermissionValues, ScopeStrings } from '../../../core/current-user-permissions.config';

export const selectCurrentUserRolesState = (state: AppState) => state.currentUserRoles;

export const selectCurrentUserStratosRolesState = (state: ICurrentUserRolesState) => state.internal;
export const selectCurrentUserStratosRoles = (role: PermissionValues) => (state: IStratosRolesState) => state[role] || false;

export const selectCurrentUserCFRolesState = (state: ICurrentUserRolesState) => state.cf;
export const selectCurrentUserCFEndpointRolesState = (endpointGuid: string) => (state: IAllCfRolesState) => state[endpointGuid];

export const selectCurrentUserCFGlobalRolesStates = (state: ICfRolesState) => state.global;
export const selectCurrentUserCFGlobalRolesState = (role: PermissionValues) => (state: IGlobalRolesState) => state[role] || false;
export const selectCurrentUserCFOrgsRolesState = (state: ICfRolesState) => state.organizations;
export const selectCurrentUserCFSpacesRolesState = (state: ICfRolesState) => state.spaces;
export const selectCurrentUserCFGlobalHasScopes = (scope: ScopeStrings) => (scopes: ScopeStrings[]) => scopes.includes(scope);
export const selectCurrentUserCFGlobalScopesState = (state: IGlobalRolesState) => state.scopes;
export const selectCurrentUserCFStratosScopesState = (state: IStratosRolesState) => state.scopes;

export const selectCurrentUserCFSpaceRolesState = (spaceId: string) => (state: ISpacesRoleState) => state[spaceId];
export const selectCurrentUserCFOrgRolesState = (orgId: string) => (state: IOrgsRoleState) => state[orgId];

// Top level stratos endpoint role objects
// ============================
export const getCurrentUserStratosRolesState = compose(
  selectCurrentUserStratosRolesState,
  selectCurrentUserRolesState
);
// ============================

// Top level stratos endpoint role objects
// ============================
export const getCurrentUserStratosRole = (role: PermissionValues) => compose(
  selectCurrentUserStratosRoles(role),
  getCurrentUserStratosRolesState
);
// ============================

// Top level stratos endpoint scopes
// ============================
export const getCurrentUserStratosHasScope = (scope: ScopeStrings) => compose(
  selectCurrentUserCFGlobalHasScopes(scope),
  selectCurrentUserCFStratosScopesState,
  getCurrentUserStratosRolesState
);
// ============================



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
  getCurrentUserCFRolesState
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


// Specific endpoint scopes
// ============================
export const getCurrentUserCFEndpointScopesState = (endpointGuid: string) => compose(
  selectCurrentUserCFGlobalScopesState,
  getCurrentUserCFGlobalStates(endpointGuid)
);
// ============================

// Has endpoint scopes
// ============================
export const getCurrentUserCFEndpointHasScope = (endpointGuid: string, scope: ScopeStrings) => compose(
  selectCurrentUserCFGlobalHasScopes(scope),
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



