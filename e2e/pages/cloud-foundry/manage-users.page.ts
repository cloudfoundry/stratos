import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Manage Users Page - Select Step
 */
export class ManageUsersSelectStep extends BasePage {
  private readonly container: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator('app-manage-users-select');
  }

  getSelectUsersList(): Locator {
    return this.container.locator('app-list');
  }
}

/**
 * Manage Users Page - Set Usernames Step
 */
export class ManageUsersSetUsernames extends BasePage {
  private readonly container: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator('app-manage-users-set-usernames');
  }

  getAddRemoveRadio(): Locator {
    return this.container.locator('mat-radio-group, app-radio-group');
  }

  getUsernamesInput(): Locator {
    return this.container.locator('app-stacked-input-actions');
  }

  getOriginForm(): Locator {
    return this.container.locator('.usernames__origin form');
  }

  async fillOrigin(origin: string): Promise<void> {
    const form = this.getOriginForm();
    const input = form.locator('input, mat-select');
    await input.fill(origin);
  }
}

/**
 * Manage Users Page - Modify Roles Step
 */
export class ManageUsersModifyRolesStep extends BasePage {
  private readonly container: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator('app-manage-users-modify');
  }

  getOrgsList(): Locator {
    return this.container.locator('.modify-users__org-roles app-list');
  }

  getSpacesList(): Locator {
    return this.container.locator('.modify-users__spaces-roles app-list');
  }

  async setOrg(orgName: string): Promise<void> {
    const orgsList = this.getOrgsList();
    const table = orgsList.locator('app-table, table');
    const firstCell = table.locator('tbody tr').first().locator('td').first();

    const select = firstCell.locator('mat-select, select');
    await select.click();

    const option = this.page.locator('mat-option, option').filter({ hasText: orgName });
    await option.click();
  }

  getOrgManagerCheckbox(): Locator {
    const table = this.getOrgsList().locator('app-table, table');
    return table.locator('tbody tr').first().locator('td').nth(1).locator('mat-checkbox');
  }

  getOrgAuditorCheckbox(): Locator {
    const table = this.getOrgsList().locator('app-table, table');
    return table.locator('tbody tr').first().locator('td').nth(2).locator('mat-checkbox');
  }

  getOrgBillingManagerCheckbox(): Locator {
    const table = this.getOrgsList().locator('app-table, table');
    return table.locator('tbody tr').first().locator('td').nth(3).locator('mat-checkbox');
  }

  getOrgUserCheckbox(): Locator {
    const table = this.getOrgsList().locator('app-table, table');
    return table.locator('tbody tr').first().locator('td').nth(4).locator('mat-checkbox');
  }

  getSpaceManagerCheckbox(row: number): Locator {
    const table = this.getSpacesList().locator('app-table, table');
    return table.locator('tbody tr').nth(row).locator('td').nth(1).locator('mat-checkbox');
  }

  getSpaceAuditorCheckbox(row: number): Locator {
    const table = this.getSpacesList().locator('app-table, table');
    return table.locator('tbody tr').nth(row).locator('td').nth(2).locator('mat-checkbox');
  }

  getSpaceDeveloperCheckbox(row: number): Locator {
    const table = this.getSpacesList().locator('app-table, table');
    return table.locator('tbody tr').nth(row).locator('td').nth(3).locator('mat-checkbox');
  }
}

/**
 * Manage Users Page - Confirm Step
 */
export class ManageUsersConfirmStep extends BasePage {
  private readonly container: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator('app-manage-users-confirm');
  }

  getActionTable(): Locator {
    return this.container.locator('app-action-monitor');
  }
}

/**
 * Manage Users Page
 * Multi-step user management wizard
 */
export class ManageUsersPage extends BasePage {
  private readonly container: Locator;
  public stepper: Locator;
  public setUsernames: ManageUsersSetUsernames;
  public selectUsersStep: ManageUsersSelectStep;
  public modifyUsersStep: ManageUsersModifyRolesStep;
  public confirmStep: ManageUsersConfirmStep;

  static determineUrl(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): string {
    let url = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      url += `/organizations/${orgGuid}`;
    }
    if (spaceGuid) {
      url += `/spaces/${spaceGuid}`;
    }
    url += '/users/manage';
    if (userGuid) {
      url += `?user=${userGuid}`;
    }
    return url;
  }

  constructor(page: Page, cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string) {
    super(page);
    const url = ManageUsersPage.determineUrl(cfGuid, orgGuid, spaceGuid, userGuid);

    this.container = page.locator('app-manage-users');
    this.stepper = page.locator('app-stepper, mat-stepper');
    this.setUsernames = new ManageUsersSetUsernames(page);
    this.selectUsersStep = new ManageUsersSelectStep(page);
    this.modifyUsersStep = new ManageUsersModifyRolesStep(page);
    this.confirmStep = new ManageUsersConfirmStep(page);
  }

  async navigateTo(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): Promise<void> {
    const url = ManageUsersPage.determineUrl(cfGuid, orgGuid, spaceGuid, userGuid);
    await this.page.goto(url);
  }
}
