export type PermissionConfigType = PermissionConfig[] | PermissionConfig | PermissionConfigLink;
export interface IPermissionConfigs {
  [permissionString: string]: PermissionConfigType;
}

export type PermissionTypes = string;
export type CurrentUserPermissions = string;
export type ScopeStrings = string;
export type PermissionValues = string;
export class PermissionConfig {
  constructor(
    public type: PermissionTypes,
    public permission: PermissionValues,
  ) { }
}
export class PermissionConfigLink {
  constructor(
    public link: CurrentUserPermissions
  ) { }
}
