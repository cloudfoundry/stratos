import { OrgUserRoleNames, SpaceUserRoleNames, CfUserRoleParams } from '../store/types/cf-user.types';
import { CfPermissionStrings } from '../user-permissions/cf-user-permissions.types';
import {
  ROLE_DEFS, cfTypeOf, bucketOfScoped, permissionOfScoped, shortLabelOfScoped, longLabelOfScoped,
} from './role-registry';

describe('role-registry', () => {
  it('covers exactly the 8 role enum values, no more no less', () => {
    const known = new Set<string>([
      ...Object.values(OrgUserRoleNames),
      ...Object.values(SpaceUserRoleNames),
    ]);
    const defined = new Set(ROLE_DEFS.map(d => d.stratos));
    expect(defined).toEqual(known);
    expect(ROLE_DEFS).toHaveLength(8);
  });

  it('derives the CF v3 type for every role', () => {
    expect(cfTypeOf(OrgUserRoleNames.BILLING_MANAGERS, false)).toBe('organization_billing_manager');
    expect(cfTypeOf(OrgUserRoleNames.USER, false)).toBe('organization_user');
    expect(cfTypeOf(SpaceUserRoleNames.SUPPORTER, true)).toBe('space_supporter');
    expect(cfTypeOf(SpaceUserRoleNames.DEVELOPER, true)).toBe('space_developer');
  });

  it('throws loudly on an unknown role', () => {
    expect(() => cfTypeOf('not_a_role', false)).toThrow(/Unknown org role/);
    expect(() => cfTypeOf('not_a_role', true)).toThrow(/Unknown space role/);
  });

  it('maps each role to its bucket via scoped helper', () => {
    expect(bucketOfScoped(OrgUserRoleNames.MANAGER, 'org')).toBe(CfUserRoleParams.MANAGED_ORGS);
    expect(bucketOfScoped(OrgUserRoleNames.USER, 'org')).toBe(CfUserRoleParams.ORGANIZATIONS);
    expect(bucketOfScoped(SpaceUserRoleNames.SUPPORTER, 'space')).toBe(CfUserRoleParams.SUPPORTED_SPACES);
    // auditors exists in both enums — scope disambiguates
    expect(bucketOfScoped(OrgUserRoleNames.AUDITOR, 'org')).toBe(CfUserRoleParams.AUDITED_ORGS);
    expect(bucketOfScoped(SpaceUserRoleNames.AUDITOR, 'space')).toBe(CfUserRoleParams.AUDITED_SPACES);
  });

  it('maps each role to its permission via scoped helper', () => {
    expect(permissionOfScoped(SpaceUserRoleNames.SUPPORTER, 'space')).toBe(CfPermissionStrings.SPACE_SUPPORTER);
    expect(permissionOfScoped(OrgUserRoleNames.BILLING_MANAGERS, 'org')).toBe(CfPermissionStrings.ORG_BILLING_MANAGER);
    expect(permissionOfScoped(OrgUserRoleNames.MANAGER, 'org')).toBe(CfPermissionStrings.ORG_MANAGER);
    expect(permissionOfScoped(SpaceUserRoleNames.MANAGER, 'space')).toBe(CfPermissionStrings.SPACE_MANAGER);
  });

  it('derives short and long labels', () => {
    expect(shortLabelOfScoped(OrgUserRoleNames.BILLING_MANAGERS)).toBe('Billing Manager');
    expect(longLabelOfScoped(OrgUserRoleNames.BILLING_MANAGERS, 'org')).toBe('Org Billing Manager');
    expect(shortLabelOfScoped(SpaceUserRoleNames.SUPPORTER)).toBe('Supporter');
    expect(longLabelOfScoped(SpaceUserRoleNames.SUPPORTER, 'space')).toBe('Space Supporter');
    expect(shortLabelOfScoped(OrgUserRoleNames.MANAGER)).toBe('Manager');
    expect(longLabelOfScoped(SpaceUserRoleNames.DEVELOPER, 'space')).toBe('Space Developer');
    expect(longLabelOfScoped(OrgUserRoleNames.USER, 'org')).toBe('Org User');
  });
});
