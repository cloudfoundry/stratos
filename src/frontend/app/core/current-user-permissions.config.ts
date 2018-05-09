export enum CurrentUserPermissions {
  APPLICATION_CREATE = 'create.application',
  SPACE_DELETE = 'delete.space',
  SPACE_EDIT = 'edit.space'
}
export type PermissionConfigType = PermissionConfig[] | PermissionConfigLink;
export interface IPermissionConfigs {
  [permissionString: string]: PermissionConfigType;
}

export enum PermissionStrings {
  _GLOBAL_ = 'global',
  SPACE_MANAGER = 'isManager',
  SPACE_AUDITOR = 'isAuditor',
  SPACE_DEVELOPER = 'isDeveloper',
  ORG_MANAGER = 'isManager',
  ORG_AUDITOR = 'isAuditor',
  ORG_BILLING_MANAGER = 'isBillingManager',
  ORG_USER = 'isUser'
}


export enum PermissionTypes {
  SPACE = 'spaces',
  ORGANIZATION = 'organizations',
  GLOBAL = 'global'
}

export class PermissionConfig {
  constructor(
    public type: PermissionTypes,
    public permission: PermissionStrings = PermissionStrings._GLOBAL_,
    public guid?: string
  ) { }
}

export class PermissionConfigLink {
  constructor(
    public link: CurrentUserPermissions
  ) { }
}

export const permissionConfigs: IPermissionConfigs = {
  [CurrentUserPermissions.APPLICATION_CREATE]: [
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ],
  [CurrentUserPermissions.SPACE_DELETE]: [
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER)
  ],
  [CurrentUserPermissions.SPACE_EDIT]: [
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
  ]
};
