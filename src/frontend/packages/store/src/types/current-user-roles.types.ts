import { StratosScopeStrings } from '../../../core/src/core/current-user-permissions.checker';

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
  scopes: StratosScopeStrings[];
}

export interface ICurrentUserRolesState<T = any> {
  internal: IStratosRolesState;
  endpoints: {
    [endpointType: string]: T // T could be different types, but it makes it nicer when using for an single endpoint type 
  }
  state: RolesRequestState;
}
