import { UserScopeStrings } from './endpoint.types';

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
    [endpointType: string]: any
  }
  state: RolesRequestState;
}
