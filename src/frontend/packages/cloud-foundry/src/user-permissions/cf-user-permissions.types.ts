/**
 * Cloud Foundry User Permission Types and Enums
 *
 * This file contains the enum definitions for CF user permissions.
 * Separated from cf-user-permissions-checkers.ts to avoid circular dependencies.
 */

export enum CfCurrentUserPermissions {
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
  SERVICE_INSTANCE_EDIT = 'edit.service-instance'
}

// Org and space entities share the same role property names (isManager, isAuditor, etc.)
// so duplicate enum values here are intentional — they are used in different entity contexts.
/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum CfPermissionStrings {
  _GLOBAL_ = 'global',
  SPACE_MANAGER = 'isManager',
  SPACE_AUDITOR = 'isAuditor',
  SPACE_DEVELOPER = 'isDeveloper',
  ORG_MANAGER = 'isManager',
  ORG_AUDITOR = 'isAuditor',
  ORG_USER = 'isUser',
  ORG_BILLING_MANAGER = 'isBillingManager',
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

export enum CfScopeStrings {
  CF_ADMIN_GROUP = 'cloud_controller.admin',
  CF_READ_ONLY_ADMIN_GROUP = 'cloud_controller.admin_read_only',
  CF_ADMIN_GLOBAL_AUDITOR_GROUP = 'cloud_controller.global_auditor',
  CF_WRITE_SCOPE = 'cloud_controller.write',
  CF_READ_SCOPE = 'cloud_controller.read',
}

export enum CfPermissionTypes {
  SPACE = 'spaces',
  ORGANIZATION = 'organizations',
  ENDPOINT = 'endpoint',
  ENDPOINT_SCOPE = 'endpoint-scope',
  FEATURE_FLAG = 'feature-flag',
}
