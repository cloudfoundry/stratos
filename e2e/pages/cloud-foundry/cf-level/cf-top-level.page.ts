import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * Cloud Foundry Top Level Page
 * Main CF endpoint page with organizations, quotas, users, etc.
 */
export class CfTopLevelPage extends BasePage {
  private readonly tabs: Locator;
  public navLink: string;

  constructor(page: Page, navLink: string = '/cloud-foundry') {
    super(page);
    this.navLink = navLink;
    this.tabs = page.locator('app-page-tabs, mat-tab-group');
  }

  static forEndpoint(page: Page, guid: string): CfTopLevelPage {
    return new CfTopLevelPage(page, `/cloud-foundry/${guid}`);
  }

  /**
   * Detect CF endpoint GUID from current URL
   */
  static async detect(page: Page): Promise<CfTopLevelPage> {
    const url = page.url();
    const urlParts = url.split('/').filter(p => p);

    const cfIndex = urlParts.indexOf('cloud-foundry');
    if (cfIndex === -1 || urlParts.length < cfIndex + 2) {
      throw new Error('Not on a Cloud Foundry page');
    }

    const cfGuid = urlParts[cfIndex + 1];
    return CfTopLevelPage.forEndpoint(page, cfGuid);
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

  async goToOrgTab(): Promise<void> {
    await this.goToTab('Organizations', 'organizations');
  }

  async goToQuotasTab(): Promise<void> {
    await this.goToTab('Organization Quotas', 'quota-definitions');
  }

  async goToRoutesTab(): Promise<void> {
    await this.goToTab('Routes', 'routes');
  }

  async goToUsersTab(): Promise<void> {
    await this.goToTab('Users', 'users');
  }

  async goToFirehoseTab(): Promise<void> {
    await this.goToTab('Firehose', 'firehose');
  }

  async goToFeatureFlagsTab(): Promise<void> {
    await this.goToTab('Feature Flags', 'feature-flags');
  }

  async goToBuildPacksTab(): Promise<void> {
    await this.goToTab('Build Packs', 'build-packs');
  }

  async goToStacksTab(): Promise<void> {
    await this.goToTab('Stacks', 'stacks');
  }

  async goToSecurityGroupsTab(): Promise<void> {
    await this.goToTab('Security Groups', 'security-groups');
  }

  private async goToTab(label: string, urlSuffix: string): Promise<void> {
    const tabButton = this.tabs.locator(`button, a`).filter({ hasText: label });
    await tabButton.waitFor({ state: 'visible', timeout: 10000 });
    await tabButton.click();
    await this.page.waitForURL(new RegExp(`${this.navLink}.*/${urlSuffix}`), { timeout: 10000 });
  }

  /**
   * Organization view operations
   */
  async goToOrgView(): Promise<void> {
    await this.goToOrgTab();
    const listComponent = this.page.locator('app-list');
    await listComponent.waitFor({ state: 'visible' });
  }

  async clickOnCard(orgName: string): Promise<void> {
    const list = this.page.locator('app-list');

    // Clear filters
    const header = list.locator('app-list-header');
    const clearButton = header.locator('button[aria-label="Clear"]');
    if (await clearButton.isVisible().catch(() => false)) {
      await clearButton.click();
    }

    // Find and click card
    const card = list.locator('app-card, mat-card').filter({ hasText: orgName });
    await card.waitFor({ state: 'visible' });
    await card.click();
  }

  async deleteOrg(orgName: string): Promise<void> {
    await this.goToOrgView();

    const list = this.page.locator('app-list');
    const card = list.locator('app-card, mat-card').filter({ hasText: orgName });
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
   * Quota operations
   */
  async clickOnQuota(quotaName: string): Promise<void> {
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

  async deleteQuota(quotaName: string, waitUntilNotShown: boolean = true): Promise<void> {
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

  /**
   * Summary tab metadata
   */
  async waitForMetadataItem(label: string): Promise<Locator> {
    const summaryTab = this.page.locator('app-cloud-foundry-summary-tab');
    const metadataItem = summaryTab.locator(`app-metadata-item[label="${label}"]`);
    await metadataItem.waitFor({ state: 'visible' });
    return metadataItem;
  }

  async getMetadataValue(label: string): Promise<string> {
    const item = await this.waitForMetadataItem(label);
    const value = item.locator('.metadata-item__value');
    return await value.textContent() || '';
  }

  async waitForInstanceAddressValue(): Promise<string> {
    const value = await this.getMetadataValue('Instance Address');
    return value.replace('content_copy', '').trim();
  }

  async isUserInviteConfigured(isAdmin: boolean = true): Promise<boolean> {
    const value = await this.getMetadataValue('User Invitation Support');
    return isAdmin ? value.startsWith('Configured') : value.startsWith('Enabled');
  }

  async canConfigureUserInvite(): Promise<boolean> {
    const value = await this.getMetadataValue('User Invitation Support');
    return value.endsWith('Configure');
  }

  /**
   * User invite configuration buttons
   */
  getInviteConfigureButton(): Locator {
    return this.page.locator('.user-invites button').filter({ hasText: 'Configure' });
  }

  getInviteDisableButton(): Locator {
    return this.page.locator('.user-invites button').filter({ hasText: 'Disable' });
  }

  async clickInviteConfigure(): Promise<void> {
    await this.getInviteConfigureButton().click();
  }

  async clickInviteDisable(): Promise<void> {
    await this.getInviteDisableButton().click();
  }

  /**
   * Page state checks
   */
  async isSummaryView(): Promise<boolean> {
    const url = this.page.url();
    return url.includes(this.navLink) && url.endsWith('/summary');
  }

  async hasNoCloudFoundryMessage(): Promise<boolean> {
    const noContent = this.page.locator('app-no-content-message, .app-no-content-container');
    const isVisible = await noContent.isVisible().catch(() => false);
    if (!isVisible) return false;

    const text = await noContent.textContent() || '';
    return text.includes('There are no connected Cloud Foundry endpoints');
  }
}
