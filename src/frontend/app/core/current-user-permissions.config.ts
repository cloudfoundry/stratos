import { CFFeatureFlagTypes } from '../shared/components/cf-auth/cf-auth.types';

export enum CurrentUserPermissions {
  APPLICATION_CREATE = 'create.application',
  SPACE_DELETE = 'delete.space',
  SPACE_EDIT = 'edit.space',
  ORGANIZATION_CREATE = 'create.org'
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
  GLOBAL = 'global',
  FEATURE_FLAG = 'feature-flag'
}

export class PermissionConfig {
  constructor(
    public type: PermissionTypes,
    public permission: CFFeatureFlagTypes | PermissionStrings = PermissionStrings._GLOBAL_,
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
  ],
  [CurrentUserPermissions.ORGANIZATION_CREATE]: [
    new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.user_org_creation),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_AUDITOR),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_BILLING_MANAGER),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_USER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ]
};
