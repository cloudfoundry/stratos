import { ActionState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';

export function getDefaultEndpointRoles(): ICfRolesState {
  return {
    global: {
      isAdmin: false,
      isReadOnlyAdmin: false,
      isGlobalAuditor: false
    },
    spaces: {

    },
    organizations: {

    }
  };
}


export interface IGlobalRolesState {
  isAdmin: boolean;
  isReadOnlyAdmin: boolean;
  isGlobalAuditor: boolean;
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

export interface ICurrentUserRolesState {
  internal: {
    isAdmin: boolean
  };
  cf: IAllCfRolesState;
}
