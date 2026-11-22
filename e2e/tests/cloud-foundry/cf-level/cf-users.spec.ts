import { test, expect } from '../../../fixtures/test-base';
import { CfTopLevelPage } from '../../../pages/cloud-foundry/cf-level/cf-top-level.page';
import { UsersPage } from '../../../pages/cloud-foundry/users.page';
import { SecretsHelper } from '../../../helpers/secrets-helpers';

/**
 * CF-level Users tab. Read-only: the CF-level removes strip the selected
 * users' roles in every org, so these tests open them and cancel.
 *
 * Reads the non-admin console user, who is a Space Developer in the test
 * org and space.
 */
test.describe('CF Users', () => {
  const username = SecretsHelper.getConsoleUserUsername();

  test.beforeEach(async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const cfPage = CfTopLevelPage.forEndpoint(page, cfGuid);
    await cfPage.navigateTo();
    await cfPage.goToUsersTab();
    await new UsersPage(page).waitForRows();
  });

  test('lists a user with their space role', async ({ connectedEndpointsAdminPage, secrets }) => {
    const users = new UsersPage(connectedEndpointsAdminPage.page);
    const { testSpace } = secrets.getCloudfoundryEndpoint(0);

    await users.filterByName(username);

    await expect(users.row(username)).toContainText(`${testSpace}: developer`);
  });

  test('filters by organization and by name', async ({ connectedEndpointsAdminPage, secrets }) => {
    const { page } = connectedEndpointsAdminPage;
    const users = new UsersPage(page);
    const { testOrg } = secrets.getCloudfoundryEndpoint(0);

    await users.filterBy('Organization', testOrg);
    await users.filterByName(username);
    await expect(users.row(username)).toBeVisible();

    await users.filterByName('no-such-user-in-this-foundation');
    await expect(users.rows()).toHaveCount(0);
    await expect(users.list.getByText('No users match the current filters')).toBeVisible();
  });

  test('enables Manage Roles and the removes only for a selection', async ({ connectedEndpointsAdminPage }) => {
    const users = new UsersPage(connectedEndpointsAdminPage.page);
    const manage = users.action('cf-users-bulk-manage-roles');
    const removeSpaces = users.action('cf-users-bulk-remove-spaces');
    const removeAll = users.action('cf-users-bulk-remove-org-spaces');

    await expect(manage).toBeDisabled();
    await expect(removeSpaces).toBeDisabled();
    await expect(removeAll).toBeDisabled();

    await users.filterByName(username);
    await users.select(username);

    await expect(users.action('list-sub-nav-selected')).toContainText('1 selected');
    await expect(manage).toBeEnabled();
    await expect(removeSpaces).toBeEnabled();
    await expect(removeAll).toBeEnabled();
  });

  test('Manage Roles opens the wizard for the selected user', async ({ connectedEndpointsAdminPage }) => {
    const { page, cfGuid } = connectedEndpointsAdminPage;
    const users = new UsersPage(page);

    await users.filterByName(username);
    await users.select(username);
    await users.action('cf-users-bulk-manage-roles').click();

    await expect(page).toHaveURL(new RegExp(`/cloud-foundry/${cfGuid}/users/manage\\?users=`));
    await expect(users.stepper()).toBeVisible();
    await expect(page.locator('app-manage-users-modify')).toContainText(username);

    await users.stepper().locator('#stepper_cancel').click();
    await expect(page).toHaveURL(new RegExp(`/cloud-foundry/${cfGuid}/users$`));
  });

  test('Remove from Spaces asks first; Cancel leaves the user as they were', async ({ connectedEndpointsAdminPage, secrets }) => {
    const users = new UsersPage(connectedEndpointsAdminPage.page);
    const { testSpace } = secrets.getCloudfoundryEndpoint(0);

    await users.filterByName(username);
    await users.select(username);
    await users.action('cf-users-bulk-remove-spaces').click();

    const dialog = users.confirmDialog();
    await expect(dialog).toContainText('Remove 1 selected user from all their space roles?');
    await dialog.locator('[data-test="confirm-dialog-cancel"]').click();

    await expect(dialog).toBeHidden();
    await expect(users.row(username)).toContainText(`${testSpace}: developer`);
  });

  test('Add User opens and cancels without adding', async ({ connectedEndpointsAdminPage }) => {
    const users = new UsersPage(connectedEndpointsAdminPage.page);

    const dialog = await users.openAddUser();
    await expect(dialog.locator('[data-test="add-user-submit"]')).toBeDisabled();
    await expect(dialog.getByTestId('org-picker')).toBeVisible();

    await dialog.locator('[data-test="add-user-cancel"]').click();
    await expect(dialog).toBeHidden();
  });
});
