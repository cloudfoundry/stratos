import { test, expect } from '../../fixtures/test-base';
import { CfTopLevelPage } from '../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { UsersPage } from '../../pages/cloud-foundry/users.page';
import { SecretsHelper } from '../../helpers/secrets-helpers';
import { createCustomName } from '../../helpers/test-utils';
import { adminCfApi, consoleUrl, userRoles } from '../roles/roles.fixture';

/**
 * The Manage Roles wizard from the CF-level Users tab, where the org is
 * picked in the wizard: Select Roles → Confirm → Apply → Close.
 *
 * Writes only inside a throwaway org that afterAll deletes (its roles go with
 * it). The user is the non-admin console user.
 */
test.describe('Manage Roles', () => {
  const username = SecretsHelper.getConsoleUserUsername();
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let orgName: string;
  let orgGuid: string;
  let spaceGuid: string;
  let userGuid: string;

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    orgName = createCustomName('e2e-users');
    orgGuid = (await admin.api.createOrg({ name: orgName })).guid;
    spaceGuid = (await admin.api.createSpace({ name: 'users', orgGuid })).guid;
    const users = await admin.call('GET', `/users?usernames=${encodeURIComponent(username)}`);
    userGuid = users.resources[0].guid;
  });

  test.afterAll(async () => {
    if (orgGuid) {
      await admin.api.deleteOrg(orgGuid);
    }
    await admin?.dispose();
  });

  test('grants a space role in an org picked in the wizard', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToUsersTab();
    const users = new UsersPage(page);
    await users.waitForRows();

    await users.filterByName(username);
    await users.select(username);
    await users.action('cf-users-bulk-manage-roles').click();

    const modify = page.locator('app-manage-users-modify');
    const picker = modify.getByTestId('org-picker');
    await picker.getByRole('textbox', { name: 'Search organizations' }).fill(orgName);
    await picker.getByRole('button', { name: orgName, exact: true }).click();
    await users.tick(users.spaceRole(modify, spaceGuid, 'Auditor'));
    await users.stepperNext().click();

    const confirm = page.locator('app-manage-users-confirm');
    await expect(confirm).toContainText(username);
    await expect(confirm).toContainText('Auditor');
    await users.applyRoleChanges();

    await expect(page).toHaveURL(new RegExp(`/cloud-foundry/${cfGuid}/users$`));
    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toContain('space_auditor');
  });

  test('with no users selected, says so instead of showing the steps', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;

    await page.goto(`/cloud-foundry/${cfGuid}/users/manage`);

    await expect(page.getByTestId('manage-users-no-users')).toContainText('No users selected');
    await expect(page.locator('app-steppers')).toHaveCount(0);
  });
});
