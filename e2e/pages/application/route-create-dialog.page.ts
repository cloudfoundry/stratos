import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Route Create Dialog Page Object
 *
 * Handles the dialog for creating and mapping routes to applications
 */
export class RouteCreateDialogPage extends BasePage {
  private readonly dialog: Locator;
  private readonly domainSelect: Locator;
  private readonly hostInput: Locator;
  private readonly pathInput: Locator;
  private readonly tcpPortInput: Locator;
  private readonly createButton: Locator;
  private readonly cancelButton: Locator;
  private readonly mapExistingButton: Locator;

  constructor(page: Page) {
    super(page);

    this.dialog = page.locator('mat-dialog-container, app-add-route-dialog, app-create-route-dialog').first();
    this.domainSelect = this.dialog.locator('mat-select[placeholder*="domain"], select[name="domain"]').first();
    this.hostInput = this.dialog.locator('input[name="host"], input[placeholder*="host"]').first();
    this.pathInput = this.dialog.locator('input[name="path"], input[placeholder*="path"]').first();
    this.tcpPortInput = this.dialog.locator('input[name="port"], input[type="number"]').first();
    this.createButton = this.dialog.locator('button').filter({ hasText: /create|add|map/i });
    this.cancelButton = this.dialog.locator('button').filter({ hasText: /cancel|close/i });
    this.mapExistingButton = this.dialog.locator('button').filter({ hasText: /map.*existing|existing.*route/i });
  }

  /**
   * Wait for dialog to be visible
   */
  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.dialog.isVisible().catch(() => false);
  }

  /**
   * Select domain from dropdown
   */
  async selectDomain(domainName: string): Promise<void> {
    await this.domainSelect.click();
    await this.page.waitForTimeout(500);

    const option = this.page.locator('mat-option, option').filter({ hasText: domainName });
    await option.click();
  }

  /**
   * Enter hostname
   */
  async enterHost(host: string): Promise<void> {
    await this.hostInput.fill(host);
  }

  /**
   * Enter path (optional)
   */
  async enterPath(path: string): Promise<void> {
    const isVisible = await this.pathInput.isVisible().catch(() => false);
    if (isVisible) {
      await this.pathInput.fill(path);
    }
  }

  /**
   * Enter TCP port
   */
  async enterTcpPort(port: string): Promise<void> {
    const isVisible = await this.tcpPortInput.isVisible().catch(() => false);
    if (isVisible) {
      await this.tcpPortInput.fill(port);
    }
  }

  /**
   * Click create/map button
   */
  async clickCreate(): Promise<void> {
    await this.createButton.first().click();
  }

  /**
   * Click cancel button
   */
  async clickCancel(): Promise<void> {
    const cancelExists = await this.cancelButton.isVisible().catch(() => false);
    if (cancelExists) {
      await this.cancelButton.first().click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Check if create button is enabled
   */
  async isCreateEnabled(): Promise<boolean> {
    return await this.createButton.first().isEnabled().catch(() => false);
  }

  /**
   * Get validation error message
   */
  async getErrorMessage(): Promise<string> {
    const errorElement = this.dialog.locator('mat-error, .error-message').first();
    const isVisible = await errorElement.isVisible().catch(() => false);
    if (isVisible) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  /**
   * Click map existing route button
   */
  async clickMapExisting(): Promise<void> {
    const buttonExists = await this.mapExistingButton.isVisible().catch(() => false);
    if (buttonExists) {
      await this.mapExistingButton.click();
    }
  }
}
