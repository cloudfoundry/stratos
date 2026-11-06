import { UserRoleLabels } from './users-roles.types';
import { OrgUserRoleNames, SpaceUserRoleNames, CfUserRoleParams } from './cf-user.types';

describe('UserRoleLabels', () => {
  it('keeps the exact labels for every role and bucket alias', () => {
    expect(UserRoleLabels.org.short[OrgUserRoleNames.BILLING_MANAGERS]).toBe('Billing Manager');
    expect(UserRoleLabels.org.short[CfUserRoleParams.BILLING_MANAGER_ORGS]).toBe('Billing Manager');
    expect(UserRoleLabels.org.long[OrgUserRoleNames.MANAGER]).toBe('Org Manager');
    expect(UserRoleLabels.org.long[CfUserRoleParams.ORGANIZATIONS]).toBe('Org User');
    expect(UserRoleLabels.space.short[SpaceUserRoleNames.SUPPORTER]).toBe('Supporter');
    expect(UserRoleLabels.space.short[CfUserRoleParams.SUPPORTED_SPACES]).toBe('Supporter');
    expect(UserRoleLabels.space.long[SpaceUserRoleNames.DEVELOPER]).toBe('Space Developer');
    expect(UserRoleLabels.space.long[CfUserRoleParams.SPACES]).toBe('Space Developer');
  });
});
