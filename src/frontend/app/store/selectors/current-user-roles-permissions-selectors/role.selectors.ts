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
} from '../../types/current-user-roles.types';

export const selectCurrentUserRolesState = (state: AppState) => state.currentUserRoles;

export const selectCurrentUserStratosRolesState = (state: ICurrentUserRolesState) => state.internal;
export const selectCurrentUserStratosRoles = (role: string) => (state: IStratosRolesState) => state[role] || false;

export const selectCurrentUserCFRolesState = (state: ICurrentUserRolesState) => state.cf;
export const selectCurrentUserCFEndpointRolesState = (endpointGuid: string) => (state: IAllCfRolesState) => state[endpointGuid];

export const selectCurrentUserCFGlobalRolesState = (state: ICfRolesState) => state.global;
export const selectCurrentUserCFOrgsRolesState = (state: ICfRolesState) => state.organizations;
export const selectCurrentUserCFSpacesRolesState = (state: ICfRolesState) => state.spaces;

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
export const getCurrentUserStratosRole = (role: string) => compose(
  selectCurrentUserStratosRoles(role),
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

// Global
// ============================
export const getCurrentUserCFGlobalState = (endpointGuid: string) => compose(
  selectCurrentUserCFGlobalRolesState,
  getCurrentUserCFEndpointRolesState(endpointGuid)
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



