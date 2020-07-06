import { RolesRequestState } from '../../../../store/src/types/current-user-roles.types';

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
  [guid: string]: ICfRolesState
}
