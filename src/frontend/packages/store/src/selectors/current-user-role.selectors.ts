import { compose } from '@ngrx/store';

import { CurrentUserRolesAppState } from '../app-state';
import { ICurrentUserRolesState, IStratosRolesState } from '../types/current-user-roles.types';
import { UserScopeStrings } from '../types/endpoint.types';

export type PermissionValues = string;

export const selectCurrentUserRolesState = (state: CurrentUserRolesAppState) => state.currentUserRoles;

const selectCurrentUserStratosRolesState = (state: ICurrentUserRolesState) => state.internal;

const selectCurrentUserStratosRoles = (role: PermissionValues) => (state: Omit<IStratosRolesState, 'scopes'>) => {
  // Note - should not cover `scopes`
  return state[role] || false;
};

export const selectCurrentUserGlobalHasScopes = (scope: UserScopeStrings) => (scopes: UserScopeStrings[]) => scopes.includes(scope);
const selectCurrentUserStratosScopesState = (state: IStratosRolesState) => state.scopes;


// Top level stratos endpoint role objects
// ============================
const getCurrentUserStratosRolesState = compose(
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
export const getCurrentUserStratosHasScope = (scope: UserScopeStrings) => compose(
  selectCurrentUserGlobalHasScopes(scope),
  selectCurrentUserStratosScopesState,
  getCurrentUserStratosRolesState
);
// ============================

