export enum CurrentUserPermissions {
  CREATE_APPLICATION = 'create.application'
}

export interface IPermissionConfigs {
  [permissionString: string]: PermissionConfig[];
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

export const permissionConfigs = {
  [CurrentUserPermissions.CREATE_APPLICATION]: [
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ]
};