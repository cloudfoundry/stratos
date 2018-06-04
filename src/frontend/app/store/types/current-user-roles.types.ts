import { ActionState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { PermissionValues, ScopeStrings } from '../../core/current-user-permissions.config';

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

    }
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
}
