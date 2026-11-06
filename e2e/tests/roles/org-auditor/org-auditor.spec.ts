import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { adminCfApi, consoleUrl, expect, expectAbsent, proxied, runName, test } from '../roles.fixture';

/**
 * Org auditor on org e2e: read-only at org level. The console's permission
 * model lists the org auditor in no allow list at all, and the CF does not
 * show it apps in spaces it holds no role in, so the seeded app must stay
 * invisible on the applications wall.
 */
test.describe('org auditor', () => {
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let appGuid: string;
  let appName: string;
  let orgGuid: string;
  let spaceGuid: string;

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    ({ testOrgGuid: orgGuid, testSpaceGuid: spaceGuid } = SecretsHelper.load().cloudFoundry[0]);
    appName = runName('orgAuditor', 'app');
    appGuid = (await admin.api.createApp({ name: appName, spaceGuid })).guid;
  });

  test.afterAll(async () => {
    await admin.api.deleteApp(appGuid).catch(() => {});
    await admin.dispose();
  });

  test('sees the org summary, its spaces and its users', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();
    await orgPage.goToSpacesTab();
    await expect(page.getByText('e2e', { exact: true }).first()).toBeVisible();
    await orgPage.goToUsersTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
  });

  test('does not see the seeded app on the applications wall', async ({ roleContext }) => {
    const { page } = roleContext;
    await page.goto('/applications');
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expect(page.getByText(appName, { exact: true })).toHaveCount(0);
  });

  test('cannot add users or change roles', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToUsersTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'cf-users-add');
    // Bulk Manage Roles stays in the toolbar for every role and is disabled
    // until the role may change roles; here it may not, so it never enables.
    await expect(page.locator('[data-test="cf-org-users-bulk-manage-roles"]')).toBeDisabled();
  });

  test('cannot create a space', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToSpacesTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('cannot edit or delete the org, or add a space quota', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();
    await expectAbsent(page, 'org-edit');
    await expectAbsent(page, 'org-delete');
    await orgPage.goToSpaceQuotasTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('the CF refuses a space create from this token', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const response = await proxied(page, cfGuid, 'POST', '/spaces', {
      name: runName('orgAuditor', 'denied'),
      relationships: { organization: { data: { guid: orgGuid } } },
    });
    expect(response.status()).toBe(403);
  });

  test('canary: sees Add User', async ({ roleContext }) => {
    test.fail(true, 'an auditor changes nothing; passing here means the control leaked');
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToUsersTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expect(page.locator('[data-test="cf-users-add"]')).toBeVisible();
  });
});
