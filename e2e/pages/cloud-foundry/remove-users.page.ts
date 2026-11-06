import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';
import { ManageUsersConfirmStep } from './manage-users.page';

/**
 * Remove Users Page
 * Multi-step user removal wizard
 */
export class RemoveUsersPage extends BasePage {
  private readonly container: Locator;
  public stepper: Locator;
  public confirmStep: ManageUsersConfirmStep;

  static determineUrl(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): string {
    let url = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      url += `/organizations/${orgGuid}`;
    }
    if (spaceGuid) {
      url += `/spaces/${spaceGuid}`;
    }
    url += '/users/remove';
    if (userGuid) {
      url += `?user=${userGuid}`;
    }
    return url;
  }

  constructor(page: Page, cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string) {
    super(page);

    this.container = page.locator('app-remove-users');
    this.stepper = page.locator('app-stepper, mat-stepper');
    this.confirmStep = new ManageUsersConfirmStep(page);
  }

  async navigateTo(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): Promise<void> {
    const url = RemoveUsersPage.determineUrl(cfGuid, orgGuid, spaceGuid, userGuid);
    await this.page.goto(url);
  }
}
