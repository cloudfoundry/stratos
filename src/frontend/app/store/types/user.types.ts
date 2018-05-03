import { IOrganization, ISpace } from '../../core/cf-api.types';
import { APIResource } from './api.types';

export interface CfUser {
  organizations?: APIResource<IOrganization>[];
  managed_organizations: APIResource<IOrganization>[];
  billing_managed_organizations: APIResource<IOrganization>[];
  audited_organizations: APIResource<IOrganization>[];
  admin: boolean;
  spaces?: APIResource<ISpace>[];
  managed_spaces?: APIResource<ISpace>[];
  audited_spaces?: APIResource<ISpace>[];
  cfGuid?: string;
  guid: string;
  username?: string;
  active: boolean;
  spaces_url: string;
  organizations_url: string;
  managed_organizations_url: string;
  billing_managed_organizations_url: string;
  audited_organizations_url: string;
  managed_spaces_url: string;
  audited_spaces_url: string;
  default_space_guid: string;
}

/**
 * Org user roles, string values as per CF API
 */
export enum OrgUserRoleNames {
  MANAGER = 'managers',
  BILLING_MANAGERS = 'billing_managers',
  AUDITOR = 'auditors',
  USER = 'users'
}
/**
 * Space user roles, string values as per CF API
 */
export enum SpaceUserRoleNames {
  MANAGER = 'managers',
  AUDITOR = 'auditors',
  DEVELOPER = 'developers'
}

export class UserRoleInOrg {
  /**
   * See {OrgUserRoleNames.MANAGER} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInOrg
   */
  managers: Boolean;
  /**
   * See {OrgUserRoleNames.BILLING_MANAGERS} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInOrg
   */
  billing_managers: Boolean;
  /**
   * See {OrgUserRoleNames.AUDITOR} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInOrg
   */
  auditors: Boolean;
  /**
   * See {OrgUserRoleNames.USER} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInOrg
   */
  users: Boolean;
}
/**
 * Temporary function. Once we move to typescript 2.7 (blocked on angular/compiler cli) we can use constant named properties in
 * UserRoleInOrg, thus can create roles without this workaround function. See
 * https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#constant-named-properties for details
 */
export function createUserRoleInOrg(manager: Boolean, billingManager: Boolean, auditor: Boolean, user: Boolean): UserRoleInOrg {
  const res = {};
  res[OrgUserRoleNames.MANAGER] = manager;
  res[OrgUserRoleNames.BILLING_MANAGERS] = billingManager;
  res[OrgUserRoleNames.AUDITOR] = auditor;
  res[OrgUserRoleNames.USER] = user;
  return res as UserRoleInOrg;
}

export interface IUserPermissionInOrg {
  name: string;
  orgGuid: string;
  permissions: UserRoleInOrg;
  spaces?: { [spaceGuid: string]: IUserPermissionInSpace };
}
export interface IUserPermissionInSpace {
  name: string;
  orgGuid: string;
  spaceGuid: string;
  permissions: UserRoleInSpace;
}

export interface UserRoleInSpace {
  /**
   * See {SpaceUserRoleNames.MANAGER} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInSpace
   */
  managers: Boolean;
  /**
   * See {SpaceUserRoleNames.DEVELOPER} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInSpace
   */
  developers: Boolean;
  /**
   * See {SpaceUserRoleNames.AUDITOR} for name
   *
   * @type {Boolean}
   * @memberof UserRoleInSpace
   */
  auditors: Boolean;
}

/**
 * Temporary function. Once we move to typescript 2.7 (blocked on angular/compiler cli) we can use constant named properties in
 * UserRoleInSpace, thus can create roles without this workaround function. See
 * https://github.com/Microsoft/TypeScript/wiki/What%27s-new-in-TypeScript#constant-named-properties for details
 *
 */
export function createUserRoleInSpace(manager: Boolean, auditor: Boolean, developer: Boolean): UserRoleInSpace {
  const res = {};
  res[SpaceUserRoleNames.MANAGER] = manager;
  res[SpaceUserRoleNames.DEVELOPER] = developer;
  res[SpaceUserRoleNames.AUDITOR] = auditor;
  return res as UserRoleInSpace;
}
