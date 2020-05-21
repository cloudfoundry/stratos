import { compose } from '@ngrx/store';

import { ICfRolesState } from '../../../cloud-foundry/src/store/types/cf-current-user-roles.types';
import { StratosScopeStrings } from '../../../core/src/core/current-user-permissions.checker';
import { PermissionValues, ScopeStrings } from '../../../core/src/core/current-user-permissions.config';
import { CurrentUserRolesAppState } from '../app-state';
import { ICurrentUserRolesState, IStratosRolesState } from '../types/current-user-roles.types';


export const selectCurrentUserRolesState = (state: CurrentUserRolesAppState) => state.currentUserRoles;

const selectCurrentUserStratosRolesState = (state: ICurrentUserRolesState) => state.internal;

const selectCurrentUserStratosRoles = (role: PermissionValues) => (state: Omit<IStratosRolesState, 'scopes'>) => {
  // Note - should not cover `scopes`
  return state[role] || false;
};

// TODO: RC tidy
// export const selectEntityWithRole = (role: PermissionStrings, type: RoleEntities) => (state: ICfRolesState) => {
//   const entityType = state[type];
//   return Object.keys(entityType).filter(entity => entityType[entity][role]);
// };

export const selectCurrentUserRequestState = (state: ICurrentUserRolesState | ICfRolesState) => state.state;

export const selectCurrentUserGlobalHasScopes = (scope: ScopeStrings) => (scopes: ScopeStrings[]) => scopes.includes(scope);
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
export const getCurrentUserStratosHasScope = (scope: StratosScopeStrings) => compose(
  selectCurrentUserGlobalHasScopes(scope),
  selectCurrentUserStratosScopesState, // TODO: RC cf stuff shouldn't be
  getCurrentUserStratosRolesState
);
// ============================


// Top level request state
// ============================
// export const getCurrentUserRequestState = compose(
//   selectCurrentUserRequestState,
//   selectCurrentUserRolesState
// );
// ============================

