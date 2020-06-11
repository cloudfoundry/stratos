import { CFFeatureFlagTypes } from '../../../cloud-foundry/src/cf-api.types';

export enum CurrentUserPermissions {
  APPLICATION_VIEW = 'view.application',
  APPLICATION_EDIT = 'edit.application',
  APPLICATION_CREATE = 'create.application',
  APPLICATION_MANAGE = 'manage.application',
  APPLICATION_VIEW_ENV_VARS = 'env-vars.view.application',
  SPACE_VIEW = 'view.space',
  SPACE_CREATE = 'create.space',
  SPACE_DELETE = 'delete.space',
  SPACE_EDIT = 'edit.space',
  SPACE_CHANGE_ROLES = 'change-roles.space',
  ROUTE_CREATE = 'create.route',
  // ROUTE_BINDING_CREATE = 'create.binding.route',
  QUOTA_CREATE = 'create.quota',
  QUOTA_EDIT = 'edit.quota',
  QUOTA_DELETE = 'delete.quota',
  SPACE_QUOTA_CREATE = 'create.space-quota',
  SPACE_QUOTA_EDIT = 'edit.space-quota',
  SPACE_QUOTA_DELETE = 'delete.space-quota',
  ORGANIZATION_CREATE = 'create.org',
  ORGANIZATION_DELETE = 'delete.org',
  ORGANIZATION_EDIT = 'edit.org',
  ORGANIZATION_SUSPEND = 'suspend.org',
  ORGANIZATION_CHANGE_ROLES = 'change-roles.org',
  SERVICE_INSTANCE_DELETE = 'delete.service-instance',
  SERVICE_INSTANCE_CREATE = 'create.service-instance',
  SERVICE_BINDING_EDIT = 'edit.service-binding',
  FIREHOSE_VIEW = 'view-firehose',
  ENDPOINT_REGISTER = 'register.endpoint',
  PASSWORD_CHANGE = 'change-password',
  SERVICE_INSTANCE_EDIT = 'edit.service-instance'
}
export type PermissionConfigType = PermissionConfig[] | PermissionConfig | PermissionConfigLink;
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
  ORG_USER = 'isUser',
  STRATOS_ADMIN = 'isAdmin'
}

export enum ScopeStrings {
  CF_ADMIN_GROUP = 'cloud_controller.admin',
  CF_READ_ONLY_ADMIN_GROUP = 'cloud_controller.admin_read_only',
  CF_ADMIN_GLOBAL_AUDITOR_GROUP = 'cloud_controller.global_auditor',
  CF_WRITE_SCOPE = 'cloud_controller.write',
  CF_READ_SCOPE = 'cloud_controller.write',
  STRATOS_CHANGE_PASSWORD = 'password.write',
  SCIM_READ = 'scim.read'
}

export enum PermissionTypes {
  SPACE = 'spaces',
  ORGANIZATION = 'organizations',
  ENDPOINT = 'endpoint',
  ENDPOINT_SCOPE = 'endpoint-scope',
  FEATURE_FLAG = 'feature-flag',
  STRATOS = 'internal',
  STRATOS_SCOPE = 'internal-scope'
}

export enum StratosPermissionTypes {
  ADMIN = 'isAdmin'
}

export type PermissionValues = StratosPermissionTypes | ScopeStrings | CFFeatureFlagTypes | PermissionStrings;
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
  [CurrentUserPermissions.APPLICATION_VIEW]: [
    // See #2186
    new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_READ_ONLY_ADMIN_GROUP),
    new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ],
  [CurrentUserPermissions.APPLICATION_CREATE]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.APPLICATION_MANAGE]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.APPLICATION_EDIT]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.APPLICATION_VIEW_ENV_VARS]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.SPACE_VIEW]: [
    // See #2186
    new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_READ_ONLY_ADMIN_GROUP),
    new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GLOBAL_AUDITOR_GROUP),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ],
  [CurrentUserPermissions.SPACE_CREATE]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.SPACE_DELETE]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.SPACE_EDIT]: [
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
  ],
  [CurrentUserPermissions.SPACE_CHANGE_ROLES]: [
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER)
  ],
  // TODO: See #4189. Wire in. Can be org manager?
  [CurrentUserPermissions.ROUTE_CREATE]: [
    new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.route_creation),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ],
  [CurrentUserPermissions.QUOTA_CREATE]: new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GROUP),
  [CurrentUserPermissions.QUOTA_EDIT]: new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GROUP),
  [CurrentUserPermissions.QUOTA_DELETE]: new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GROUP),
  [CurrentUserPermissions.SPACE_QUOTA_CREATE]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.SPACE_QUOTA_EDIT]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.SPACE_QUOTA_DELETE]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.ORGANIZATION_CREATE]: [
    new PermissionConfig(PermissionTypes.FEATURE_FLAG, CFFeatureFlagTypes.user_org_creation),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_AUDITOR),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_BILLING_MANAGER),
    new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_USER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_MANAGER),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_AUDITOR),
    new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER)
  ],
  [CurrentUserPermissions.ORGANIZATION_DELETE]: new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GROUP),
  [CurrentUserPermissions.ORGANIZATION_EDIT]: new PermissionConfigLink(CurrentUserPermissions.ORGANIZATION_DELETE),
  [CurrentUserPermissions.ORGANIZATION_SUSPEND]: new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_ADMIN_GROUP),
  [CurrentUserPermissions.ORGANIZATION_CHANGE_ROLES]: new PermissionConfig(PermissionTypes.ORGANIZATION, PermissionStrings.ORG_MANAGER),
  [CurrentUserPermissions.SERVICE_INSTANCE_DELETE]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.SERVICE_INSTANCE_CREATE]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.SERVICE_INSTANCE_EDIT]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.SERVICE_BINDING_EDIT]: new PermissionConfig(PermissionTypes.SPACE, PermissionStrings.SPACE_DEVELOPER),
  [CurrentUserPermissions.FIREHOSE_VIEW]: [
    new PermissionConfig(PermissionTypes.ENDPOINT_SCOPE, ScopeStrings.CF_READ_ONLY_ADMIN_GROUP)
  ],
  [CurrentUserPermissions.ENDPOINT_REGISTER]: new PermissionConfig(PermissionTypes.STRATOS, PermissionStrings.STRATOS_ADMIN),
  [CurrentUserPermissions.PASSWORD_CHANGE]: new PermissionConfig(PermissionTypes.STRATOS_SCOPE, ScopeStrings.STRATOS_CHANGE_PASSWORD),
};
