import { Page, Locator } from '@playwright/test';
import { FormComponent, MenuComponent } from '../../components';

/**
 * API Key Add Dialog Page
 * Dialog for creating new API keys
 * Migrated from src/test-e2e/apikeys/po/apikey-add-dialog.po.ts
 */
export class ApiKeyAddDialogPage {
  public readonly form: FormComponent;
  public readonly buttons: MenuComponent;
  private readonly dialog: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('app-add-api-key-dialog, mat-dialog-container').first();
    this.form = new FormComponent(page, this.dialog.locator('.key-dialog, form').first());
    this.buttons = new MenuComponent(page, this.dialog.locator('.key-dialog__actions, mat-dialog-actions, .dialog-actions').first());
  }

  /**
   * Close the dialog
   */
  async close(): Promise<void> {
    const items = await this.buttons.getItemMap();
    if (items.cancel) {
      await items.cancel.click();
    } else {
      // Fallback to close button
      const closeButton = this.dialog.locator('button').filter({ hasText: /cancel|close/i });
      await closeButton.click();
    }
  }

  /**
   * Check if close button is enabled
   */
  async canClose(): Promise<boolean> {
    const items = await this.buttons.getItemMap();
    if (items.cancel) {
      return !items.cancel.disabled;
    }
    return true;
  }

  /**
   * Create the API key
   */
  async create(): Promise<void> {
    const items = await this.buttons.getItemMap();
    if (items.create) {
      await items.create.click();
    } else {
      // Fallback to create button
      const createButton = this.dialog.locator('button').filter({ hasText: /create|add/i });
      await createButton.click();
    }
  }

  /**
   * Check if create button is enabled
   */
  async canCreate(): Promise<boolean> {
    const items = await this.buttons.getItemMap();
    if (items.create) {
      return !items.create.disabled;
    }

    // Fallback: check button directly
    const createButton = this.dialog.locator('button').filter({ hasText: /create|add/i });
    return await createButton.isEnabled();
  }

  /**
   * Wait for dialog to be shown
   */
  async waitUntilShown(title?: string): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 5000 });

    if (title) {
      const dialogTitle = this.dialog.locator('h1, h2, mat-dialog-title, .dialog-title');
      await expect(dialogTitle).toContainText(title);
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

// Import expect for waitUntilShown with title check
import { expect } from '@playwright/test';
