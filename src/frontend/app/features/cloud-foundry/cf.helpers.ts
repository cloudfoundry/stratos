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

export function isManager(user: CfUser, orgGuid: string): boolean {
  return hasRole(user, orgGuid, 'managed_organizations');
}

export function isBillingManager(user: CfUser, orgGuid: string): boolean {
  return hasRole(user, orgGuid, 'billing_managed_organizations');
}

export function isAuditor(user: CfUser, orgGuid: string): boolean {
  return hasRole(user, orgGuid, 'audited_organizations');
}

export function isUser(user: CfUser, orgGuid: string): boolean {
  return hasRole(user, orgGuid, 'organizations');
}

function hasRole(user: CfUser, orgGuid: string, type: string) {
  return user[type].find(o => o.metadata.guid === orgGuid) != null;
}

