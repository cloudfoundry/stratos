import {
  IUserPermissionInOrg,
  IUserPermissionInSpace,
  UserRoleInOrg,
  UserRoleInSpace,
  createUserRoleInOrg,
  createUserRoleInSpace,
} from '../../store/types/cf-user.types';
import { StUser } from '../../services/endpoint-data/stratos-types';

// StUser buckets carry backend stripRolePrefix SINGULAR names:
//   org   -> 'manager' | 'billing_manager' | 'auditor' | 'user'
//   space -> 'manager' | 'auditor' | 'developer'
// createUserRoleInOrg/InSpace key by the PLURAL OrgUserRoleNames enum values.

export function orgPermissionsFromRoles(roles: string[]): UserRoleInOrg {
  return createUserRoleInOrg(
    roles.includes('manager'),
    roles.includes('billing_manager'),
    roles.includes('auditor'),
    roles.includes('user'),
  );
}

export function spacePermissionsFromRoles(roles: string[]): UserRoleInSpace {
  return createUserRoleInSpace(
    roles.includes('manager'),
    roles.includes('auditor'),
    roles.includes('developer'),
  );
}

export function orgRolesFromStUser(user: StUser, orgNameByGuid?: Map<string, string>): IUserPermissionInOrg[] {
  return user.orgRoles.map(b => ({
    name: orgNameByGuid?.get(b.orgGuid) ?? '',
    orgGuid: b.orgGuid,
    permissions: orgPermissionsFromRoles(b.roles),
  }));
}

export function spaceRolesFromStUser(
  user: StUser,
  orgNameByGuid?: Map<string, string>,
  spaceNameByGuid?: Map<string, string>,
): IUserPermissionInSpace[] {
  return user.spaceRoles.map(b => ({
    name: spaceNameByGuid?.get(b.spaceGuid) ?? '',
    orgGuid: b.orgGuid,
    orgName: orgNameByGuid?.get(b.orgGuid) ?? '',
    spaceGuid: b.spaceGuid,
    permissions: spacePermissionsFromRoles(b.roles),
  }));
}

const hasOrgRole = (u: StUser, orgGuid: string, role: string) =>
  u.orgRoles.some(b => b.orgGuid === orgGuid && b.roles.includes(role));
const hasSpaceRole = (u: StUser, spaceGuid: string, role: string) =>
  u.spaceRoles.some(b => b.spaceGuid === spaceGuid && b.roles.includes(role));

export const stIsOrgManager = (u: StUser, g: string) => hasOrgRole(u, g, 'manager');
export const stIsOrgBillingManager = (u: StUser, g: string) => hasOrgRole(u, g, 'billing_manager');
export const stIsOrgAuditor = (u: StUser, g: string) => hasOrgRole(u, g, 'auditor');
export const stIsOrgUser = (u: StUser, g: string) => hasOrgRole(u, g, 'user');
export const stIsSpaceManager = (u: StUser, g: string) => hasSpaceRole(u, g, 'manager');
export const stIsSpaceAuditor = (u: StUser, g: string) => hasSpaceRole(u, g, 'auditor');
export const stIsSpaceDeveloper = (u: StUser, g: string) => hasSpaceRole(u, g, 'developer');

export const stHasRoleInOrg = (u: StUser, orgGuid: string): boolean =>
  u.orgRoles.some(b => b.orgGuid === orgGuid && b.roles.length > 0) ||
  u.spaceRoles.some(b => b.orgGuid === orgGuid && b.roles.length > 0);
