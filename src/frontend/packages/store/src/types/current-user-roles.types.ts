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

export interface ICurrentUserRolesState<T = any> {
  internal: IStratosRolesState;
  endpoints: {
    // T could be different in each endpoint type, however supplying a type makes it nicer to use when looking at a specific type
    [endpointType: string]: T
  }
  state: RolesRequestState;
}
