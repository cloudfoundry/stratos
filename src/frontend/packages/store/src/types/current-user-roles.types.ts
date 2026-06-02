import { UserScopeStrings } from './endpoint.types';

/**
 * A role/permission key looked up on a roles state object (e.g. `isAdmin`).
 * Relocated here from the (now-removed) `current-user-role.selectors` so the
 * signal-native `CurrentUserRolesDataService` and its consumers have a stable,
 * ngrx-free home for the type.
 */
export type PermissionValues = string;

export interface RolesRequestState {
  initialised: boolean;
  fetching: boolean;
  error: boolean;
}

export function getDefaultRolesRequestState(): RolesRequestState {
  return {
    initialised: false,
    fetching: false,
    error: false
  };
}

export interface IStratosRolesState {
  isAdmin: boolean;
  scopes: UserScopeStrings[];
}

export interface ICurrentUserRolesState {
  internal: IStratosRolesState;
  endpoints: {
    [endpointType: string]: any;
  };
  state: RolesRequestState;
}
