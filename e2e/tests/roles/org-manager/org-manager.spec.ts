import { StepperBase } from '../../../helpers/stepper-base';
import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';
import {
  adminCfApi, clearUserRoles, expect, expectAbsent, proxied, runName, test, userRoles, consoleUrl,
} from '../roles.fixture';

/**
 * Org manager on org e2e: may shape the org (spaces, space quotas, roles)
 * and read its apps, but is not a space developer, so the app-level writes
 * and env vars stay out of reach; org quotas and the org itself are the CF
 * admin's alone.
 *
 * Seeded as admin: an app in e2e/e2e to read against, and org-01-dev-1
 * stripped of every role in the org so the add-by-username flow starts clean.
 */
const TARGET_USER = 'org-01-dev-1';

test.describe('org manager', () => {
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let appGuid: string;
  let appName: string;
  let targetGuid: string;
  let orgGuid: string;
  let spaceGuid: string;
  const createdSpaces: string[] = [];

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    ({ testOrgGuid: orgGuid, testSpaceGuid: spaceGuid } = SecretsHelper.load().cloudFoundry[0]);
    appName = runName('orgManager', 'app');
    appGuid = (await admin.api.createApp({ name: appName, spaceGuid })).guid;
    targetGuid = await clearUserRoles(admin, TARGET_USER, orgGuid, spaceGuid);
  });

  test.afterAll(async () => {
    for (const name of createdSpaces) {
      const space = await admin.api.findSpaceByName(orgGuid, name).catch(() => null);
      if (space) await admin.api.deleteSpace(space.guid).catch(() => {});
    }
    await clearUserRoles(admin, TARGET_USER, orgGuid, spaceGuid).catch(() => {});
    await admin.api.deleteApp(appGuid).catch(() => {});
    await admin.dispose();
  });

  test('sees the org and its spaces', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();
    await orgPage.goToSpacesTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expect(page.getByText('e2e', { exact: true }).first()).toBeVisible();
  });

  test('creates a space and deletes it again', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const name = runName('orgManager', 'space');
    createdSpaces.push(name);

    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToSpacesTab();
    await page.locator('[data-test="list-sub-nav-add"]').click();
    await page.waitForURL(/\/add-space/);
    await new StepperBase(page).fillStepperField('spaceName', name);
    await page.locator('#stepper_next').click();
    await page.waitForURL(/\/spaces$/);
    const spaceLink = page.getByText(name, { exact: true }).first();
    await expect(spaceLink).toBeVisible();

    // Delete from the space's own summary, the way the console offers it.
    await spaceLink.click();
    await page.waitForURL(/\/spaces\/[^/]+/);
    await page.locator('[data-test="space-delete"]').click();
    await page.locator('[data-test="confirm-dialog-confirm"]').click();
    await page.waitForURL(/\/spaces$/);
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('adds a user to the org by username and sees the row at once', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToUsersTab();
    await page.locator('[data-test="cf-users-add"]').click();

    const dialog = page.locator('[role="dialog"]');
    await dialog.locator('[data-test="stacked-input"]').first().fill(TARGET_USER);
    await dialog.getByTestId('org-role-cell').filter({ hasText: /^\s*User\s*$/ }).locator('input[type="checkbox"]').click();
    await dialog.locator('[data-test="add-user-submit"]').click();
    await expect(dialog).toHaveCount(0);

    // The list shows the new row without a reload.
    await expect(page.getByText(TARGET_USER, { exact: true }).first()).toBeVisible();
    await expect.poll(() => userRoles(admin, targetGuid, orgGuid, spaceGuid)).toContain('organization_user');
  });

  test('cannot create an application in the space', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToAppsTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('cannot edit or delete the org', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();
    await expectAbsent(page, 'org-edit');
    await expectAbsent(page, 'org-delete');
  });

  test("cannot see an app's environment variables", async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    await page.goto(`/applications/${cfGuid}/${appGuid}/summary`);
    await expect(page.locator('[data-test="page-tab-Summary"]')).toBeVisible();
    await expectAbsent(page, 'page-tab-Variables');
  });

  test('the CF refuses an app create from this token', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const response = await proxied(page, cfGuid, 'POST', '/apps', {
      name: runName('orgManager', 'denied'),
      relationships: { space: { data: { guid: spaceGuid } } },
    });
    expect(response.status()).toBe(403);
  });

  test('canary: sees Delete Organization', async ({ roleContext }) => {
    test.fail(true, 'deleting the org is the CF admin\'s alone; passing here means the control leaked');
    const { page, cfGuid } = roleContext;
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.waitForPage();
    await expect(page.locator('[data-test="org-delete"]')).toBeVisible();
  });
});
