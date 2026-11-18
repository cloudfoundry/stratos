import { Page, Locator, expect } from '@playwright/test';

export type ApiKeyExpiry = '30' | '90' | '365' | 'never';

/**
 * Create an API Key dialog: a Details step (Description and an expiry),
 * then a Secret step that shows the new key's secret once.
 */
export class ApiKeyAddDialogPage {
  /** Read state through these with expect(...).toBeEnabled()/toBeDisabled(), which retry. */
  public readonly cancelButton: Locator;
  public readonly createButton: Locator;
  public readonly doneButton: Locator;
  public readonly description: Locator;
  public readonly expiry: Locator;
  /** The Secret step's row: the masked or shown secret, its toggle and copy button. */
  public readonly secretRow: Locator;
  public readonly showSecretToggle: Locator;
  public readonly copyButton: Locator;
  /** Announces how a copy went ("Copied to clipboard" or "Copy failed"). */
  public readonly copyStatus: Locator;
  private readonly dialog: Locator;

  constructor(page: Page) {
    this.dialog = page.locator('[role="dialog"]').filter({ has: page.locator('app-create-api-key-stepper') });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
    this.createButton = this.dialog.getByRole('button', { name: 'Create', exact: true });
    this.doneButton = this.dialog.getByRole('button', { name: 'Done', exact: true });
    this.description = this.dialog.getByLabel('Description');
    this.expiry = this.dialog.locator('#api-key-expiry');
    this.secretRow = this.dialog.locator('#apikey-secret');
    this.showSecretToggle = this.secretRow.getByRole('button', { name: 'Hide Secret' });
    this.copyButton = this.secretRow.locator('app-copy-to-clipboard button');
    this.copyStatus = this.secretRow.locator('app-copy-to-clipboard [aria-live]');
  }

  /** Cancel on the Details step. */
  async close(): Promise<void> {
    await this.cancelButton.click();
  }

  async fillDescription(text: string): Promise<void> {
    await this.description.fill(text);
  }

  async chooseExpiry(choice: ApiKeyExpiry): Promise<void> {
    await this.expiry.selectOption(choice);
  }

  /** Create the key; the dialog moves on to the Secret step. */
  async create(): Promise<void> {
    await this.createButton.click();
    await this.secretRow.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Show the secret (hidden until asked) and return it. */
  async revealSecret(): Promise<string> {
    await this.showSecretToggle.click();
    const shown = this.secretRow.locator('.break-all');
    await shown.waitFor({ state: 'visible', timeout: 5000 });
    return (await shown.textContent())?.trim() ?? '';
  }

  async copySecret(): Promise<void> {
    await this.copyButton.click();
  }

  /** Done on the Secret step closes the dialog. */
  async done(): Promise<void> {
    await this.doneButton.click();
  }

  /**
   * Wait for dialog to be shown
   */
  async waitUntilShown(title?: string): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });

    if (title) {
      await expect(this.dialog.locator('h2')).toContainText(title);
    }
  }

  /**
   * Wait for dialog to be hidden
   */
  async waitUntilNotShown(): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Check if dialog is displayed
   */
  async isDisplayed(): Promise<boolean> {
    return await this.dialog.isVisible();
  }
}
