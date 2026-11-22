import { test, expect } from '../../../fixtures/test-base';
import { CfSpaceLevelPage } from '../../../pages/cloud-foundry/space-level/cf-space-level.page';
import { UsersPage } from '../../../pages/cloud-foundry/users.page';
import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { createCustomName } from '../../../helpers/test-utils';
import { adminCfApi, consoleUrl, userRoles } from '../../roles/roles.fixture';

/**
 * Space-level Users tab, end to end: add a user with a space role, add a
 * second role through Manage Roles, then remove them from the space.
 *
 * Writes only inside a throwaway org that afterAll deletes (its roles go with
 * it). The user is the non-admin console user.
 */
test.describe('Space Users', () => {
  test.describe.configure({ mode: 'serial' });

  const username = SecretsHelper.getConsoleUserUsername();
  let admin: Awaited<ReturnType<typeof adminCfApi>>;
  let orgGuid: string;
  let spaceGuid: string;
  let userGuid: string;

  test.beforeAll(async () => {
    admin = await adminCfApi(consoleUrl());
    const org = await admin.api.createOrg({ name: createCustomName('e2e-users') });
    orgGuid = org.guid;
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

  const openUsersTab = async (page: import('@playwright/test').Page, cfGuid: string): Promise<UsersPage> => {
    const spacePage = CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
    await spacePage.navigateTo();
    await spacePage.goToUsersTab();
    return new UsersPage(page);
  };

  test('Add User grants a space role in this space', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    const dialog = await users.openAddUser();
    await dialog.locator('[data-test="stacked-input"]').first().fill(username);
    await users.tick(users.spaceRole(dialog, spaceGuid, 'Auditor'));
    await dialog.locator('[data-test="add-user-submit"]').click();
    await expect(dialog).toBeHidden({ timeout: 30000 });

    await expect(users.row(username)).toContainText('auditor', { timeout: 30000 });
    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toContain('space_auditor');
  });

  test('Manage Roles adds a second space role', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    await users.select(username);
    await users.action('cf-space-users-bulk-manage-roles').click();

    const modify = page.locator('app-manage-users-modify');
    await users.tick(users.spaceRole(modify, spaceGuid, 'Manager'));
    await users.stepperNext().click();

    const confirm = page.locator('app-manage-users-confirm');
    await expect(confirm).toContainText(username);
    await expect(confirm).toContainText('Manager');
    await users.applyRoleChanges();
    await expect(users.row(username)).toContainText('manager', { timeout: 30000 });
    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toEqual(
      expect.arrayContaining(['space_auditor', 'space_manager']),
    );
  });

  test('Remove from Space removes the roles in this space', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    await users.select(username);
    await users.action('cf-space-users-bulk-remove-space').click();

    const dialog = users.confirmDialog();
    await expect(dialog).toContainText('Remove 1 selected user from this space?');
    await dialog.locator('[data-test="confirm-dialog-confirm"]').click();

    await expect(users.row(username)).toHaveCount(0, { timeout: 30000 });
    await expect
      .poll(async () => (await userRoles(admin, userGuid, orgGuid, spaceGuid)).filter(r => r.startsWith('space_')), { timeout: 60000 })
      .toEqual([]);
  });
});
