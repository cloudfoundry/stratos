import { test, expect } from '../../../fixtures/test-base';
import { CfOrgLevelPage } from '../../../pages/cloud-foundry/org-level/cf-org-level.page';
import { UsersPage } from '../../../pages/cloud-foundry/users.page';
import { SecretsHelper } from '../../../helpers/secrets-helpers';
import { createCustomName } from '../../../helpers/test-utils';
import { adminCfApi, consoleUrl, userRoles } from '../../roles/roles.fixture';

/**
 * Org-level Users tab, end to end: add a user with an org role, give them a
 * space role through Manage Roles, remove them from the org, then add and
 * remove an org role through Manage by Username.
 *
 * Writes only inside a throwaway org that afterAll deletes (its roles go with
 * it). The user is the non-admin console user.
 */
test.describe('Org Users', () => {
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
    const orgPage = CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
    await orgPage.navigateTo();
    await orgPage.goToUsersTab();
    return new UsersPage(page);
  };

  test('Add User grants an org role in this org', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    const dialog = await users.openAddUser();
    // Opened from an org, the dialog is locked to it: no org picker.
    await expect(dialog.getByTestId('org-picker')).toHaveCount(0);
    await dialog.locator('[data-test="stacked-input"]').first().fill(username);
    await users.tick(users.orgRole(dialog, 'Auditor'));
    await dialog.locator('[data-test="add-user-submit"]').click();
    await expect(dialog).toBeHidden({ timeout: 30000 });

    await expect(users.row(username)).toContainText('auditor', { timeout: 30000 });
    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toContain('organization_auditor');
  });

  test('Manage Roles adds a space role', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    await users.select(username);
    await users.action('cf-org-users-bulk-manage-roles').click();

    const modify = page.locator('app-manage-users-modify');
    await users.tick(users.spaceRole(modify, spaceGuid, 'Developer'));
    await users.stepperNext().click();

    const confirm = page.locator('app-manage-users-confirm');
    await expect(confirm).toContainText(username);
    await expect(confirm).toContainText('Developer');
    await users.applyRoleChanges();
    await expect(users.row(username)).toContainText('users: developer', { timeout: 30000 });
    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toContain('space_developer');
  });

  test('Remove from Org and Spaces removes the roles in this org', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    await users.select(username);
    await users.action('cf-org-users-bulk-remove-org-spaces').click();

    const dialog = users.confirmDialog();
    await expect(dialog).toContainText('from all their org and space roles in this org?');
    await dialog.locator('[data-test="confirm-dialog-confirm"]').click();

    await expect(users.row(username)).toHaveCount(0, { timeout: 30000 });
    await expect.poll(() => userRoles(admin, userGuid, orgGuid, spaceGuid), { timeout: 60000 }).toEqual([]);
  });

  test('Manage by Username adds an org role by username', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    const modify = await users.manageByUsername('cf-org-users-roles-by-username', 'Add Roles', username);
    await expect(modify).toContainText('Roles will be added to the following users');
    await users.tick(users.orgRole(modify, 'Billing Manager'));
    await users.stepperNext().click();
    await users.applyRoleChanges();

    expect(await userRoles(admin, userGuid, orgGuid, spaceGuid)).toContain('organization_billing_manager');
  });

  test('Manage by Username removes an org role by username', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = await openUsersTab(page, cfGuid);

    const modify = await users.manageByUsername('cf-org-users-roles-by-username', 'Remove Roles', username);
    await expect(modify).toContainText('Roles will be removed from the following users');
    await users.tick(users.orgRole(modify, 'Billing Manager'));
    await users.stepperNext().click();
    await users.applyRoleChanges();

    await expect
      .poll(() => userRoles(admin, userGuid, orgGuid, spaceGuid), { timeout: 60000 })
      .not.toContain('organization_billing_manager');
  });
});
