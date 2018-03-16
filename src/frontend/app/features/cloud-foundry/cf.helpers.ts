import { ActivatedRoute } from '@angular/router';

import { APIResource } from '../../store/types/api.types';
import { CfUser, UserRoleInOrg, UserRoleInSpace } from '../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from './cf-page.types';

export enum OrgUserRoles {
  MANAGER = 'managers',
  BILLING_MANAGERS = 'billing_managers',
  AUDITOR = 'auditors',
  USER = 'users'
}

export interface IOrgUserRole {
  string: string;
  key: OrgUserRoles;
}

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
export function getSpaceRolesString(userRolesInSpace: UserRoleInSpace): string {
  let roles = null;
  if (userRolesInSpace.manager) {
    roles = 'Manager';
  }
  if (userRolesInSpace.auditor) {
    roles = assignRole(roles, 'Auditor');

  }
  if (userRolesInSpace.developer) {
    roles = assignRole(roles, 'Developer');
  }

  return roles ? roles : 'None';
}

export function getOrgRoles(userRolesInOrg: UserRoleInOrg): IOrgUserRole[] {
  const roles = [];
  if (userRolesInOrg.orgManager) {
    roles.push({
      string: 'Manager',
      key: OrgUserRoles.MANAGER
    });
  }
  if (userRolesInOrg.billingManager) {
    roles.push({
      string: 'Billing Manager',
      key: OrgUserRoles.BILLING_MANAGERS
    });
  }
  if (userRolesInOrg.auditor) {
    roles.push({
      string: 'Auditor',
      key: OrgUserRoles.AUDITOR
    });
  }
  if (userRolesInOrg.user) {
    roles.push({
      string: 'User',
      key: OrgUserRoles.USER
    });
  }
  return roles;
}

function assignRole(currentRoles: string, role: string) {
  const newRoles = currentRoles ? `${currentRoles}, ${role}` : role;
  return newRoles;
}

export function isOrgManager(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'managed_organizations');
}

export function isOrgBillingManager(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'billing_managed_organizations');
}

export function isOrgAuditor(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'audited_organizations');
}

export function isOrgUser(user: CfUser, guid: string): boolean {
  return hasRole(user, guid, 'organizations');
}

export function isSpaceManager(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'managed_spaces');
}

export function isSpaceAuditor(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'audited_spaces');
}

export function isSpaceDeveloper(user: CfUser, spaceGuid: string): boolean {
  return hasRole(user, spaceGuid, 'spaces');
}

function hasRole(user: CfUser, guid: string, roleType: string) {
  if (user[roleType]) {
    const roles = user[roleType] as APIResource[];
    return !!roles.find(o => o.metadata.guid === guid);
  }
  return false;
}

export const getRowMetadata = (entity: APIResource) => entity.metadata ? entity.metadata.guid : null;

export function getIdFromRoute(activatedRoute: ActivatedRoute, id: string) {
  if (activatedRoute.snapshot.params[id]) {
    return activatedRoute.snapshot.params[id];
  } else if (activatedRoute.parent) {
    return getIdFromRoute(activatedRoute.parent, id);
  }
  return null;
}

export function getActiveRouteCfOrgSpace(activatedRoute: ActivatedRoute) {
  return ({
    cfGuid: getIdFromRoute(activatedRoute, 'cfId'),
    orgGuid: getIdFromRoute(activatedRoute, 'orgId'),
    spaceGuid: getIdFromRoute(activatedRoute, 'spaceId')
  });
}

export const getActiveRouteCfOrgSpaceProvider = {
  provide: ActiveRouteCfOrgSpace,
  useFactory: getActiveRouteCfOrgSpace,
  deps: [
    ActivatedRoute,
  ]
};
