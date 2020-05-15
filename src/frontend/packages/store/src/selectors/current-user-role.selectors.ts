import { compose } from '@ngrx/store';

import { ICfRolesState, RoleEntities } from '../../../cloud-foundry/src/store/types/cf-current-user-roles.types';
import { PermissionStrings, PermissionValues, ScopeStrings } from '../../../core/src/core/current-user-permissions.config';
import { CurrentUserRolesAppState } from '../app-state';
import { ICurrentUserRolesState, IStratosRolesState } from '../types/current-user-roles.types';


export const selectCurrentUserRolesState = (state: CurrentUserRolesAppState) => state.currentUserRoles;

export const selectCurrentUserStratosRolesState = (state: ICurrentUserRolesState) => state.internal;

export const selectCurrentUserStratosRoles = (role: PermissionValues) => (state: Omit<IStratosRolesState, 'scopes'>) => {
  // Note - should not cover `scopes`
  return state[role] || false;
};

export const selectEntityWithRole = (role: PermissionStrings, type: RoleEntities) => (state: ICfRolesState) => {
  const entityType = state[type];
  return Object.keys(entityType).filter(entity => entityType[entity][role]);
};

export const selectCurrentUserRequestState = (state: ICurrentUserRolesState | ICfRolesState) => state.state;

// TODO: CF code in this file - needs to be moved out - #3769
export const selectCurrentUserCFGlobalHasScopes = (scope: ScopeStrings) => (scopes: ScopeStrings[]) => scopes.includes(scope);
export const selectCurrentUserCFStratosScopesState = (state: IStratosRolesState) => state.scopes;


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


// Top level request state
// ============================
export const getCurrentUserRequestState = compose(
  selectCurrentUserRequestState,
  selectCurrentUserRolesState
);
// ============================

