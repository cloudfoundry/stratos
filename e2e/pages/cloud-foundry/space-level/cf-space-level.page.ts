import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Cloud Foundry Space Level Page
 * Space page with applications, services, routes, users tabs
 */
export class CfSpaceLevelPage extends BasePage {
  private readonly tabs: Locator;
  public navLink: string;

  constructor(page: Page, navLink: string) {
    super(page);
    this.navLink = navLink;
    this.tabs = page.locator('app-page-tabs, mat-tab-group');
  }

  static forEndpoint(page: Page, guid: string, orgGuid: string, spaceGuid: string): CfSpaceLevelPage {
    const navLink = `/cloud-foundry/${guid}/organizations/${orgGuid}/spaces/${spaceGuid}`;
    return new CfSpaceLevelPage(page, navLink);
  }

  /**
   * Detect from the URL
   */
  static async detect(page: Page): Promise<CfSpaceLevelPage> {
    const url = page.url();
    const urlParts = url.split('/').filter(p => p);

    const cfIndex = urlParts.indexOf('cloud-foundry');
    if (cfIndex === -1 || urlParts.length < cfIndex + 6) {
      throw new Error('Not on a Cloud Foundry space page');
    }

    if (urlParts[cfIndex + 2] !== 'organizations') {
      throw new Error('Not on an organizations page');
    }

    if (urlParts[cfIndex + 4] !== 'spaces') {
      throw new Error('Not on a spaces page');
    }

    const cfGuid = urlParts[cfIndex + 1];
    const orgGuid = urlParts[cfIndex + 3];
    const spaceGuid = urlParts[cfIndex + 5];

    return CfSpaceLevelPage.forEndpoint(page, cfGuid, orgGuid, spaceGuid);
  }

  /**
   * Navigate to page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto(this.navLink);
  }

  /**
   * Tab navigation
   */
  async goToSummaryTab(): Promise<void> {
    await this.goToTab('Summary', 'summary');
  }

  async goToAppsTab(): Promise<void> {
    await this.goToTab('Applications', 'apps');
  }

  async goToSITab(): Promise<void> {
    await this.goToTab('Services', 'service-instances');
  }

  async goToUPSITab(): Promise<void> {
    await this.goToTab('User Services', 'user-service-instances');
  }

  async goToRoutesTab(): Promise<void> {
    await this.goToTab('Routes', 'routes');
  }

  async goToUsersTab(): Promise<void> {
    await this.goToTab('Users', 'users');
  }

  private async goToTab(label: string, urlSuffix: string): Promise<void> {
    const tabButton = this.tabs.locator(`button, a`).filter({ hasText: label });
    await tabButton.waitFor({ state: 'visible', timeout: 10000 });
    await tabButton.click();
    await this.page.waitForURL(new RegExp(`${this.navLink}.*/${urlSuffix}`), { timeout: 10000 });
  }

  /**
   * Delete space
   */
  async deleteSpace(spaceName: string): Promise<void> {
    const subHeader = this.page.locator('app-page-header-sub, .page-header__sub');
    const deleteButton = subHeader.locator('button[aria-label="delete"], button').filter({ hasText: /delete/i });
    await deleteButton.click();

    // Confirm dialog
    const confirmDialog = this.page.locator('app-confirm-dialog, mat-dialog-container');
    await confirmDialog.waitFor({ state: 'visible' });

    const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|delete/i });
    await confirmButton.click();
  }
}
