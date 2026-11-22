import { Page, Locator, expect } from '@playwright/test';

/**
 * Users tab at CF, org or space level: the signal list, its sub-nav
 * actions, the Add User dialog and the Manage Roles wizard.
 *
 * Sub-nav action hooks per level:
 *   CF:    cf-users-add, cf-users-bulk-manage-roles,
 *          cf-users-bulk-remove-spaces, cf-users-bulk-remove-org-spaces
 *   org:   cf-users-add, cf-org-users-roles-by-username,
 *          cf-org-users-bulk-manage-roles, cf-org-users-bulk-remove-org-spaces
 *   space: cf-users-add, cf-space-users-roles-by-username,
 *          cf-space-users-bulk-manage-roles, cf-space-users-bulk-remove-space
 */
export class UsersPage {
  readonly list: Locator;

  constructor(private readonly page: Page) {
    this.list = page.locator('app-signal-list');
  }

  action(dataTest: string): Locator {
    return this.page.locator(`[data-test="${dataTest}"]`);
  }

  rows(): Locator {
    return this.list.locator('[data-test="row"], [data-test="card"]');
  }

  /** The row (table) or card for one user, found by its selection checkbox. */
  row(username: string): Locator {
    // `has` is matched inside each row, so it must not be rooted at the list.
    return this.rows().filter({
      has: this.page.getByRole('checkbox', { name: `Select ${username}`, exact: true }),
    });
  }

  selectBox(username: string): Locator {
    return this.list.getByRole('checkbox', { name: `Select ${username}`, exact: true });
  }

  /** Tick one user's row. Waits as long as waitForRows: the list may still be loading. */
  async select(username: string): Promise<void> {
    const box = this.selectBox(username);
    await expect(box).toBeVisible({ timeout: 60000 });
    await box.click();
  }

  /** The list loads every user and their roles in one request: give it time. */
  async waitForRows(): Promise<void> {
    await expect(this.rows().first()).toBeVisible({ timeout: 60000 });
  }

  async filterByName(text: string): Promise<void> {
    await this.list.locator('[data-test="name-filter"]').fill(text);
  }

  async filterBy(dropdown: 'Organization' | 'Space', optionLabel: string): Promise<void> {
    await this.list.locator(`select[id="dropdown-${dropdown}"]`).selectOption({ label: optionLabel });
  }

  // ── Add User dialog ────────────────────────────────────────────────────

  addUserDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Add User' });
  }

  async openAddUser(): Promise<Locator> {
    await this.action('cf-users-add').click();
    const dialog = this.addUserDialog();
    await expect(dialog).toBeVisible();
    return dialog;
  }

  // ── Role checkboxes (Add User dialog and Manage Roles "Select Roles") ──

  /**
   * Tick a role checkbox. The role picker keeps every checkbox disabled
   * while it loads the users' existing roles, which on a lab foundation can
   * take longer than a click's own wait.
   */
  async tick(roleBox: Locator): Promise<void> {
    await expect(roleBox).toBeEnabled({ timeout: 60000 });
    await roleBox.click();
    await expect(roleBox).toHaveAttribute('aria-checked', 'true');
  }

  /** Org role checkbox ('Manager', 'Auditor', 'Billing Manager', 'User'). */
  orgRole(root: Locator, label: string): Locator {
    return root.getByTestId('org-role-cell').getByRole('checkbox', { name: label, exact: true });
  }

  /** Space role checkbox ('Manager', 'Auditor', 'Developer', ...) for one space. */
  spaceRole(root: Locator, spaceGuid: string, label: string): Locator {
    return root.locator(`[data-space="${spaceGuid}"]`).getByRole('checkbox', { name: label, exact: true });
  }

  // ── Manage Roles wizard ────────────────────────────────────────────────

  stepper(): Locator {
    return this.page.locator('app-steppers');
  }

  stepperNext(): Locator {
    return this.stepper().locator('#stepper_next');
  }

  /**
   * Manage by Username: open the wizard on its Usernames step, choose Add
   * Roles or Remove Roles, enter one username and go on to Select Roles.
   */
  async manageByUsername(action: string, mode: 'Add Roles' | 'Remove Roles', username: string): Promise<Locator> {
    await this.action(action).click();
    await expect(this.page).toHaveURL(/\/users\/manage\?setByUsername=true$/);
    const step = this.page.locator('app-manage-users-set-usernames');
    await step.getByRole('radio', { name: mode, exact: true }).check();
    await step.locator('[data-test="stacked-input"]').first().fill(username);
    await this.stepperNext().click();
    const modify = this.page.locator('app-manage-users-modify');
    await expect(modify).toContainText(username);
    return modify;
  }

  /**
   * Confirm step: Apply, wait until every listed change reads Done, then
   * Close. A space role can bring an implied org User role with it, so the
   * table may list more changes than were ticked.
   */
  async applyRoleChanges(): Promise<void> {
    const confirm = this.page.locator('app-manage-users-confirm');
    const changes = confirm.locator('tbody tr');
    await expect(changes.first()).toBeVisible();
    const count = await changes.count();

    await expect(this.stepperNext()).toHaveText(/Apply/);
    await this.stepperNext().click();
    await expect(confirm.getByText('Done', { exact: true })).toHaveCount(count, { timeout: 30000 });

    await expect(this.stepperNext()).toHaveText(/Close/);
    await this.stepperNext().click();
  }

  // ── Confirmation dialog (bulk remove) ──────────────────────────────────

  confirmDialog(): Locator {
    return this.page.locator('app-dialog-confirm');
  }
}
