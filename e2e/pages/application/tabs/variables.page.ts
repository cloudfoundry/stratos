import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application Variables Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-variables.po.ts
 *
 * Represents the application environment variables tab
 */
export class ApplicationPageVariablesTab extends ApplicationBasePage {
  private readonly listComponent: Locator;
  private readonly addButton: Locator;
  private readonly inlineForm: Locator;
  private readonly saveButton: Locator;
  private readonly tableRows: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'variables');

    this.listComponent = page.locator('app-list');
    this.addButton = this.listComponent.locator('button[aria-label="add"]');
    this.inlineForm = this.listComponent.locator('.list-header__inline-add-form');
    this.saveButton = this.inlineForm.locator('button').filter({ hasText: /add|save/i });
    this.tableRows = this.listComponent.locator('app-table tbody tr');
  }

  /**
   * Get list component
   */
  getList(): Locator {
    return this.listComponent;
  }

  /**
   * Add a new environment variable
   * @param name Variable name
   * @param value Variable value
   */
  async addVariable(name: string, value: string): Promise<void> {
    await this.addButton.click();
    await this.inlineForm.waitFor({ state: 'visible' });

    await this.inlineForm.locator('input[name="envvarname"], input[formcontrolname="envvarname"]').fill(name);
    await this.inlineForm.locator('input[name="envvarvalue"], input[formcontrolname="envvarvalue"]').fill(value);

    await this.saveButton.click();

    // Wait for table to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Edit an existing variable
   * @param rowIndex Row index
   * @param newValue New value
   */
  async editVariable(rowIndex: number, newValue: string): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    const editButton = row.locator('button[aria-label="edit"]');

    await editButton.click();

    const valueInput = row.locator('input[name="envvarvalue"], input[formcontrolname="envvarvalue"]');
    await valueInput.fill(newValue);

    const saveButton = row.locator('button').filter({ hasText: /save/i });
    await saveButton.click();

    // Wait for save to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Delete a variable
   * @param rowIndex Row index
   * @param variableName Variable name (for confirmation)
   */
  async deleteVariable(rowIndex: number, variableName: string): Promise<void> {
    const row = this.tableRows.nth(rowIndex);
    const actionButton = row.locator('app-table-cell-actions button');

    await actionButton.click();

    const deleteOption = this.page.locator('button, mat-option').filter({ hasText: 'Delete' });
    await deleteOption.click();

    // Wait for confirmation dialog
    const confirmDialog = this.page.locator('app-confirm-dialog, mat-dialog-container');
    await confirmDialog.waitFor({ state: 'visible' });

    // Verify message
    const message = confirmDialog.locator('.confirm-dialog__message');
    const messageText = await message.textContent();

    if (messageText && !messageText.includes(variableName)) {
      throw new Error(`Expected confirmation for '${variableName}', got: ${messageText}`);
    }

    // Confirm deletion
    const confirmButton = confirmDialog.locator('button').filter({ hasText: /confirm|delete/i });
    await confirmButton.click();

    // Wait for deletion to complete
    await this.page.waitForTimeout(500);
  }
}
