import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Cloud Foundry Organization Level Page
 * Organization page with spaces, quotas, users tabs
 */
export class CfOrgLevelPage extends BasePage {
  private readonly tabs: Locator;
  public navLink: string;

  constructor(page: Page, navLink?: string) {
    super(page);
    this.navLink = navLink || '';
    this.tabs = page.locator('app-page-tabs, mat-tab-group');
  }

  static forEndpoint(page: Page, guid: string, orgGuid: string): CfOrgLevelPage {
    const navLink = `/cloud-foundry/${guid}/organizations/${orgGuid}`;
    return new CfOrgLevelPage(page, navLink);
  }

  /**
   * Detect from the URL
   */
  static async detect(page: Page): Promise<CfOrgLevelPage> {
    const url = page.url();
    const urlParts = url.split('/').filter(p => p);

    const cfIndex = urlParts.indexOf('cloud-foundry');
    if (cfIndex === -1 || urlParts.length < cfIndex + 4) {
      throw new Error('Not on a Cloud Foundry organization page');
    }

    if (urlParts[cfIndex + 2] !== 'organizations') {
      throw new Error('Not on an organizations page');
    }

    const cfGuid = urlParts[cfIndex + 1];
    const orgGuid = urlParts[cfIndex + 3];

    return CfOrgLevelPage.forEndpoint(page, cfGuid, orgGuid);
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

  async goToSpacesTab(): Promise<void> {
    await this.goToTab('Spaces', 'spaces');
  }

  async goToSpaceQuotasTab(): Promise<void> {
    await this.goToTab('Space Quotas', 'space-quota-definitions');
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
   * Space operations
   */
  async clickOnCard(cardName: string): Promise<void> {
    const list = this.page.locator('app-list');
    const card = list.locator('app-card, mat-card').filter({ hasText: cardName });
    await card.waitFor({ state: 'visible' });
    await card.click();
  }

  async deleteSpace(spaceName: string): Promise<void> {
    const list = this.page.locator('app-list');
    await list.locator('app-card, mat-card').first().waitFor({ state: 'visible' });

    const card = list.locator('app-card, mat-card').filter({ hasText: spaceName });
    await card.waitFor({ state: 'visible' });

    // Open action menu
    const menuButton = card.locator('.meta-card__header__button, button[aria-label="menu"]');
    await menuButton.click();

    // Click delete
    const deleteOption = this.page.locator('button, mat-option').filter({ hasText: 'Delete' });
    await deleteOption.click();

    // Confirm dialog
    const confirmDialog = this.page.locator('app-confirm-dialog, mat-dialog-container');
    await confirmDialog.waitFor({ state: 'visible' });

    const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|delete/i });
    await confirmButton.click();

    // Wait for card to disappear
    await card.waitFor({ state: 'hidden', timeout: 20000 });
  }

  /**
   * Space quota operations
   */
  async clickOnSpaceQuota(quotaName: string): Promise<void> {
    const list = this.page.locator('app-list');
    const table = list.locator('app-table, table');
    await table.waitFor({ state: 'visible' });

    // Set search text
    const header = list.locator('app-list-header');
    const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(quotaName);
    }

    // Click on quota link
    const row = table.locator('tbody tr').filter({ hasText: quotaName });
    const link = row.locator('a');
    await link.click();
  }

  async deleteSpaceQuota(quotaName: string, waitUntilNotShown: boolean = true): Promise<void> {
    const list = this.page.locator('app-list');
    const table = list.locator('app-table, table');
    await table.waitFor({ state: 'visible' });

    // Set search text
    const header = list.locator('app-list-header');
    const searchInput = header.locator('input[placeholder*="Search"], input[type="text"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(quotaName);
    }

    // Open row action menu
    const row = table.locator('tbody tr').filter({ hasText: quotaName });
    const actionButton = row.locator('app-table-cell-actions button, button[aria-label="Actions"]');
    await actionButton.click();

    // Click delete
    const deleteOption = this.page.locator('button, mat-option').filter({ hasText: 'Delete' });
    await deleteOption.click();

    // Confirm dialog
    const confirmDialog = this.page.locator('app-confirm-dialog, mat-dialog-container');
    await confirmDialog.waitFor({ state: 'visible' });

    const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|delete/i });
    await confirmButton.click();

    if (waitUntilNotShown) {
      await row.waitFor({ state: 'hidden', timeout: 20000 });
    }
  }
}
