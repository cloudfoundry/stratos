import { CfUser, UserRoleInOrg } from '../../store/types/user.types';

export function getOrgRolesString(userRolesInOrg: UserRoleInOrg): string {
  let roles = null;
  if (userRolesInOrg.orgManager) {
    roles = 'Manager';
  }
  if (userRolesInOrg.billingManager) {
    roles = assignRole(roles, 'Billing Manager');
  }
  if (userRolesInOrg.auditor) {
    roles = assignRole(roles, 'Auditor');

  }
  if (userRolesInOrg.user && !userRolesInOrg.orgManager) {
    roles = assignRole(roles, 'User');
  }

  return roles ? roles : 'None';
}

function assignRole(currentRoles: string, role: string) {
  const newRoles = currentRoles ? `${currentRoles}, ${role}` : role;
  return newRoles;
}

export function isOrgManager(user: CfUser, orgGuid: string): boolean {
  return hasOrgRole(user, orgGuid, 'managed_organizations');
}

export function isOrgBillingManager(user: CfUser, orgGuid: string): boolean {
  return hasOrgRole(user, orgGuid, 'billing_managed_organizations');
}

export function isOrgAuditor(user: CfUser, orgGuid: string): boolean {
  return hasOrgRole(user, orgGuid, 'audited_organizations');
}

export function isOrgUser(user: CfUser, orgGuid: string): boolean {
  return hasOrgRole(user, orgGuid, 'organizations');
}

function hasOrgRole(user: CfUser, orgGuid: string, type: string) {
  return user[type].find(o => o.metadata.guid === orgGuid) != null;
}

