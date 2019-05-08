import { ScopeStrings } from '../../../core/src/core/current-user-permissions.config';


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

export function getDefaultEndpointRoles(): ICfRolesState {
  return {
    global: {
      isAdmin: false,
      isReadOnlyAdmin: false,
      isGlobalAuditor: false,
      canRead: false,
      canWrite: false,
      scopes: []
    },
    spaces: {

    },
    organizations: {

    },
    state: getDefaultRolesRequestState()
  };
}

export enum RoleEntities {
  ORGS = 'organizations',
  SPACES = 'spaces'
}
export interface IGlobalRolesState {
  isAdmin: boolean;
  isReadOnlyAdmin: boolean;
  isGlobalAuditor: boolean;
  canRead: boolean;
  canWrite: boolean;
  scopes: string[];
}
export interface ISpaceRoleState {
  orgId: string;
  isManager: boolean;
  isAuditor: boolean;
  isDeveloper: boolean;
}
export interface ISpacesRoleState {
  [spaceId: string]: ISpaceRoleState;
}
export interface IOrgRoleState {
  isManager: boolean;
  isAuditor: boolean;
  isBillingManager: boolean;
  isUser: boolean;
  spaceGuids: string[];
}
export interface IOrgsRoleState {
  [orgId: string]: IOrgRoleState;
}
export interface ICfRolesState {
  global: IGlobalRolesState;
  spaces: ISpacesRoleState;
  organizations: IOrgsRoleState;
  state: RolesRequestState;
}

export interface IAllCfRolesState {
  [guid: string]: ICfRolesState;
}

export interface IStratosRolesState {
  isAdmin: boolean;
  scopes: ScopeStrings[];
}

export interface ICurrentUserRolesState {
  internal: IStratosRolesState;
  cf: IAllCfRolesState;
  state: RolesRequestState;
}
