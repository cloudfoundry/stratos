// Stratos User Permissions
export enum CurrentUserPermissions {
  ENDPOINT_REGISTER = 'register.endpoint',
  PASSWORD_CHANGE = 'change-password',
}

export interface IPermissionConfigs {
  [permissionString: string]: PermissionConfig;
}

export enum PermissionStrings {
  _GLOBAL_ = 'global',
  STRATOS_ADMIN = 'isAdmin'
}

export enum ScopeStrings {
  STRATOS_CHANGE_PASSWORD = 'password.write',
  SCIM_READ = 'scim.read'
}

export enum PermissionTypes {
  STRATOS = 'internal',
  STRATOS_SCOPE = 'internal-scope'
}

export enum StratosPermissionTypes {
  ADMIN = 'isAdmin'
}

export type PermissionValues = StratosPermissionTypes | ScopeStrings | PermissionStrings;
export class PermissionConfig {
  constructor(
    public type: PermissionTypes,
    public permission: PermissionValues = PermissionStrings._GLOBAL_
  ) { }
}
export class PermissionConfigLink {
  constructor(
    public link: CurrentUserPermissions
  ) { }
}

// For each set permissions are checked by permission types of ENDPOINT, ENDPOINT_SCOPE, STRATOS_SCOPE, FEATURE_FLAG or a random bag.
// Every group result must be true in order for the permission to be true. A group result is true if all or some of it's permissions are
// true (see `getCheckFromConfig`).
export const permissionConfigs: IPermissionConfigs = {
  [CurrentUserPermissions.ENDPOINT_REGISTER]: new PermissionConfig(PermissionTypes.STRATOS, PermissionStrings.STRATOS_ADMIN),
  [CurrentUserPermissions.PASSWORD_CHANGE]: new PermissionConfig(PermissionTypes.STRATOS_SCOPE, ScopeStrings.STRATOS_CHANGE_PASSWORD),
};
