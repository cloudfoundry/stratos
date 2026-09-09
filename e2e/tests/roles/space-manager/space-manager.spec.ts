import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';
import {
  adminCfApi, clearUserRoles, consoleUrl, expect, expectAbsent, grantRole, proxied, runName, test, userRoles,
} from '../roles.fixture';

/**
 * Space manager on e2e/e2e: may edit the space and change roles inside it,
 * nothing at org level and none of the developer writes.
 *
 * Seeded as admin: org-01-dev-2 as a space developer so the space users
 * list has the row this role will grant a further role to.
 */
const TARGET_USER = 'org-01-dev-2';

test.describe('space manager', () => {
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let targetGuid: string;
  let orgGuid: string;
  let spaceGuid: string;

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    ({ testOrgGuid: orgGuid, testSpaceGuid: spaceGuid } = SecretsHelper.load().cloudFoundry[0]);
    targetGuid = await clearUserRoles(admin, TARGET_USER, orgGuid, spaceGuid);
    await grantRole(admin, 'organization_user', targetGuid, { orgGuid });
    await grantRole(admin, 'space_developer', targetGuid, { spaceGuid });
  });

  test.afterAll(async () => {
    await clearUserRoles(admin, TARGET_USER, orgGuid, spaceGuid).catch(() => {});
    await admin.dispose();
  });

  test('sees the space and its users', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.waitForPage();
    await spacePage.goToUsersTab();
    await expect(page.getByText(TARGET_USER, { exact: true }).first()).toBeVisible();
  });

  test('grants a space role through Manage Roles, org roles locked', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToUsersTab();
    await page.locator('tr', { hasText: TARGET_USER }).locator('[data-test="row-checkbox"]').click();
    await page.locator('[data-test="cf-space-users-bulk-manage-roles"]').click();
    await page.waitForURL(/\/users\/manage/);

    // Org roles are the org manager's: every org role cell is disabled for
    // this role, while the space's own cells are live.
    const orgCells = page.getByTestId('org-role-cell').locator('[role="checkbox"]');
    await expect(orgCells.first()).toBeVisible();
    await expect(orgCells.locator('xpath=self::*[not(contains(@class, "disabled"))]')).toHaveCount(0);

    const cell = page.locator(`[data-space="${spaceGuid}"]`).getByTestId('space-role-cell').filter({ hasText: /Auditor/ });
    await cell.locator('[role="checkbox"]').click();
    await page.locator('#stepper_next').click(); // Select Roles -> Confirm
    await page.locator('#stepper_next').click(); // Confirm -> apply
    await expect.poll(() => userRoles(admin, targetGuid, orgGuid, spaceGuid), { timeout: 30000 })
      .toEqual(expect.arrayContaining(['space_auditor', 'space_developer']));
  });

  test('cannot delete the space', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.waitForPage();
    await expect(page.locator('[data-test="space-edit"]')).toBeVisible();
    await expectAbsent(page, 'space-delete');
  });

  test('cannot create a space', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToSpacesTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('cannot create an application or a space quota', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToAppsTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');

    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToSpaceQuotasTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('the CF refuses a space create from this token', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const response = await proxied(page, cfGuid, 'POST', '/spaces', {
      name: runName('spaceManager', 'denied'),
      relationships: { organization: { data: { guid: orgGuid } } },
    });
    expect(response.status()).toBe(403);
  });

  test('canary: sees Delete Space', async ({ roleContext }) => {
    test.fail(true, 'deleting a space is the org manager\'s; passing here means the control leaked');
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.waitForPage();
    await expect(page.locator('[data-test="space-delete"]')).toBeVisible();
  });
});
