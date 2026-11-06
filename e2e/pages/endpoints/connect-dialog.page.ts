import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Connect Endpoint Dialog Page Object
 * Migrated from src/test-e2e/endpoints/connect-dialog.po.ts
 *
 * Handles the endpoint connection dialog
 */
export class ConnectDialogPage extends BasePage {
  private readonly dialog: Locator;
  private readonly form: Locator;
  private readonly actions: Locator;
  private readonly cancelButton: Locator;
  private readonly connectButton: Locator;

  constructor(page: Page) {
    super(page);

    this.dialog = page.locator('app-connect-endpoint-dialog');
    this.form = this.dialog.locator('form');
    this.actions = this.dialog.locator('.connection-dialog__actions');
    this.cancelButton = this.actions.locator('button').filter({ hasText: /cancel/i });
    this.connectButton = this.actions.locator('button').filter({ hasText: /connect/i });
  }

  /**
   * Close the dialog
   */
  async close(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Click connect button
   */
  async connect(): Promise<void> {
    await this.connectButton.click();
  }

  /**
   * Check if connect button is enabled
   */
  async canConnect(): Promise<boolean> {
    return await this.connectButton.isEnabled();
  }

  /**
   * Get form locator for field interactions
   */
  getForm(): Locator {
    return this.form;
  }

  /**
   * Get dialog locator
   */
  getDialog(): Locator {
    return this.dialog;
  }

  /**
   * Wait for dialog to be visible
   */
  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Wait for dialog to be hidden
   */
  async waitForDialogClose(): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Fill form field by name
   */
  async fillField(fieldName: string, value: string): Promise<void> {
    const field = this.form.locator(`input[name="${fieldName}"], input[formcontrolname="${fieldName}"]`).first();
    await field.fill(value);
  }

  /**
   * Get form field by name
   */
  getField(fieldName: string): Locator {
    return this.form.locator(`input[name="${fieldName}"], input[formcontrolname="${fieldName}"]`).first();
  }
}
