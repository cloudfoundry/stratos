import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';
import { adminCfApi, consoleUrl, expect, expectAbsent, proxied, runName, test } from '../roles.fixture';

/**
 * Space auditor on e2e/e2e: reads the space's apps, routes and services and
 * writes nothing. Env vars are the space developer's, so the Variables tab
 * must not appear on the seeded app.
 */
test.describe('space auditor', () => {
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let appGuid: string;
  let appName: string;
  let orgGuid: string;
  let spaceGuid: string;

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    ({ testOrgGuid: orgGuid, testSpaceGuid: spaceGuid } = SecretsHelper.load().cloudFoundry[0]);
    appName = runName('spaceAuditor', 'app');
    appGuid = (await admin.api.createApp({ name: appName, spaceGuid })).guid;
  });

  test.afterAll(async () => {
    await admin.api.deleteApp(appGuid).catch(() => {});
    await admin.dispose();
  });

  test("sees the space's applications, routes and services", async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.waitForPage();
    await spacePage.goToAppsTab();
    await expect(page.getByText(appName, { exact: true }).first()).toBeVisible();
    await spacePage.goToRoutesTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await spacePage.goToSITab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
  });

  test('cannot create an application', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToAppsTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'list-sub-nav-add');
  });

  test('cannot add users or manage space roles', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToUsersTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    await expectAbsent(page, 'cf-users-add');
    // Bulk Manage Roles stays in the toolbar for every role and is disabled
    // until the role may change roles; here it may not, so it never enables.
    await expect(page.locator('[data-test="cf-space-users-bulk-manage-roles"]')).toBeDisabled();
  });

  test('cannot edit or delete the space', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.waitForPage();
    await expectAbsent(page, 'space-edit');
    await expectAbsent(page, 'space-delete');
  });

  test("cannot see the app's environment variables", async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    await page.goto(`/applications/${cfGuid}/${appGuid}/summary`);
    await expect(page.locator('[data-test="page-tab-Summary"]')).toBeVisible();
    await expectAbsent(page, 'page-tab-Variables');
  });

  test('the CF refuses a space rename from this token', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const response = await proxied(page, cfGuid, 'PATCH', `/spaces/${spaceGuid}`, { name: runName('spaceAuditor', 'denied') });
    expect(response.status()).toBe(403);
  });

  test("canary: sees the app's Variables tab", async ({ roleContext }) => {
    test.fail(true, 'env vars are the space developer\'s; passing here means the tab leaked');
    const { page, cfGuid } = roleContext;
    await page.goto(`/applications/${cfGuid}/${appGuid}/summary`);
    // The tab list renders before the permission check answers, so settle
    // first: the leak this guards against is the tab staying once it has.
    await expect(page.locator('[data-test="page-tab-Summary"]')).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page.locator('[data-test="page-tab-Variables"]')).toBeVisible({ timeout: 2000 });
  });
});
