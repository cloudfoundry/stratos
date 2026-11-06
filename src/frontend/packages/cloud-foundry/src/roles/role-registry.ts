import { OrgUserRoleNames, SpaceUserRoleNames, CfUserRoleParams } from '../store/types/cf-user.types';
import { CfPermissionStrings } from '../user-permissions/cf-user-permissions.types';

export type RoleScope = 'org' | 'space';

export interface RoleDef {
  /** Stratos enum value = the CF-plural param string (e.g. 'billing_managers'). */
  stratos: OrgUserRoleNames | SpaceUserRoleNames;
  scope: RoleScope;
  /** The user's relation bucket on a CfUser (e.g. 'managed_organizations'). */
  bucket: CfUserRoleParams;
  /** The UI permission string used by the permission checkers. */
  permission: CfPermissionStrings;
}

/**
 * Single source of truth for CF role facts. Adding a role = ONE entry here
 * (plus the Go bucket mirror in native_current_user_roles_reads.go). The CF v3
 * type and display labels are DERIVED — see helpers below. Only the bucket and
 * permission are irregular enough to enumerate.
 *
 * Order: org (Manager, Auditor, Billing Manager, User), then
 *        space (Manager, Auditor, Developer, Supporter).
 * Later tasks rely on this order.
 */
export const ROLE_DEFS: ReadonlyArray<RoleDef> = [
  { stratos: OrgUserRoleNames.MANAGER,          scope: 'org',   bucket: CfUserRoleParams.MANAGED_ORGS,         permission: CfPermissionStrings.ORG_MANAGER },
  { stratos: OrgUserRoleNames.AUDITOR,          scope: 'org',   bucket: CfUserRoleParams.AUDITED_ORGS,         permission: CfPermissionStrings.ORG_AUDITOR },
  { stratos: OrgUserRoleNames.BILLING_MANAGERS, scope: 'org',   bucket: CfUserRoleParams.BILLING_MANAGER_ORGS, permission: CfPermissionStrings.ORG_BILLING_MANAGER },
  { stratos: OrgUserRoleNames.USER,             scope: 'org',   bucket: CfUserRoleParams.ORGANIZATIONS,        permission: CfPermissionStrings.ORG_USER },
  { stratos: SpaceUserRoleNames.MANAGER,        scope: 'space', bucket: CfUserRoleParams.MANAGED_SPACES,       permission: CfPermissionStrings.SPACE_MANAGER },
  { stratos: SpaceUserRoleNames.AUDITOR,        scope: 'space', bucket: CfUserRoleParams.AUDITED_SPACES,       permission: CfPermissionStrings.SPACE_AUDITOR },
  { stratos: SpaceUserRoleNames.DEVELOPER,      scope: 'space', bucket: CfUserRoleParams.SPACES,               permission: CfPermissionStrings.SPACE_DEVELOPER },
  { stratos: SpaceUserRoleNames.SUPPORTER,      scope: 'space', bucket: CfUserRoleParams.SUPPORTED_SPACES,     permission: CfPermissionStrings.SPACE_SUPPORTER },
];

export const ORG_ROLE_DEFS: ReadonlyArray<RoleDef> = ROLE_DEFS.filter(d => d.scope === 'org');
export const SPACE_ROLE_DEFS: ReadonlyArray<RoleDef> = ROLE_DEFS.filter(d => d.scope === 'space');

/** Scope-keyed map: `'org:managers'` → RoleDef. Disambiguates 'managers'/'auditors' overlap. */
const BY_SCOPE_ROLE = new Map<string, RoleDef>(
  ROLE_DEFS.map(d => [`${d.scope}:${d.stratos}`, d])
);

function lookup(role: string, isSpace: boolean): RoleDef {
  const scope: RoleScope = isSpace ? 'space' : 'org';
  const def = BY_SCOPE_ROLE.get(`${scope}:${role}`);
  if (!def) {
    throw new Error(`Unknown ${isSpace ? 'space' : 'org'} role: ${role}`);
  }
  return def;
}

/** CF v3 role type, e.g. 'organization_billing_manager'. Derived; throws on unknown. */
export function cfTypeOf(role: string, isSpace: boolean): string {
  lookup(role, isSpace); // validates loudly
  const singular = role.replace(/s$/, '');
  return `${isSpace ? 'space' : 'organization'}_${singular}`;
}

/** Role's CfUserRoleParams bucket. Requires explicit scope to avoid 'managers'/'auditors' ambiguity. */
export function bucketOfScoped(role: string, scope: RoleScope): CfUserRoleParams {
  return lookup(role, scope === 'space').bucket;
}

/** Role's CfPermissionStrings value. Requires explicit scope to avoid 'managers'/'auditors' ambiguity. */
export function permissionOfScoped(role: string, scope: RoleScope): CfPermissionStrings {
  return lookup(role, scope === 'space').permission;
}

function titleCase(s: string): string {
  return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/** Short display label, e.g. 'Billing Manager'. Derived from the CF singular tail. Scope-independent. */
export function shortLabelOfScoped(role: string): string {
  return titleCase(role.replace(/s$/, ''));
}

/** Long display label, e.g. 'Org Billing Manager' / 'Space Supporter'. */
export function longLabelOfScoped(role: string, scope: RoleScope): string {
  return `${scope === 'space' ? 'Space' : 'Org'} ${shortLabelOfScoped(role)}`;
}
