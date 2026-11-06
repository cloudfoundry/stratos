import { CfTopLevelPage } from '../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { connectedUser, expect, expectAbsent, proxied, test } from './roles.fixture';

/**
 * Checks every role project runs, each as its own session. The canary is
 * written to assert the one thing that must never be true here — the
 * session being the admin's — and is marked as expected to fail, so a role
 * project silently running on the admin state turns the run red.
 */
test.describe('every role', () => {
  test('the CF endpoint is connected as the role user', async ({ roleContext }) => {
    const { page, username } = roleContext;
    await page.goto('/endpoints');
    await expect(page.getByText(username, { exact: true }).first()).toBeVisible();
  });

  test('Create Organization follows the user_org_creation feature flag', async ({ roleContext }) => {
    const { page, cfGuid } = roleContext;
    const flag = await (await proxied(page, cfGuid, 'GET', '/feature_flags/user_org_creation')).json();
    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToOrgTab();
    await expect(page.locator('[data-test="list-sub-nav"]')).toBeVisible();
    if (flag.enabled) {
      await expect(page.locator('[data-test="list-sub-nav-add"]')).toBeVisible();
    } else {
      await expectAbsent(page, 'list-sub-nav-add');
    }
  });

  test('canary: the session is the admin user', async ({ roleContext, secrets }) => {
    test.fail(true, 'a role project must never run on the admin identity');
    const tokenUser = await connectedUser(roleContext.page, { guid: roleContext.cfGuid, cnsi_type: 'cf' });
    expect(tokenUser).toBe(secrets.console.admin.username);
  });
});
