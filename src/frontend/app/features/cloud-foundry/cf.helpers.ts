import { CfUser, UserRoleInOrg } from '../../store/types/user.types';

export interface IOrgUserRole {
  string: string;
  key: string;
}

export function getOrgRolesString(userRolesInOrg: UserRoleInOrg): string {
  let roles = null;
  debugger;
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

export function getOrgRoles(userRolesInOrg: UserRoleInOrg): IOrgUserRole[] {
  const roles = [];
  if (userRolesInOrg.orgManager) {
    roles.push({
      string: 'Manager',
      key: 'managers'
    });
  }
  if (userRolesInOrg.billingManager) {
    roles.push({
      string: 'Billing Manager',
      key: 'billing_managers'
    });
  }
  if (userRolesInOrg.auditor) {
    roles.push({
      string: 'Auditor',
      key: 'auditors'
    });
  }
  if (userRolesInOrg.user) {
    roles.push({
      string: 'User',
      key: 'users'
    });
  }
  return roles;
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

