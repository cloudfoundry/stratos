import { Page, Locator } from '@playwright/test';

/**
 * Dialog Button
 */
export interface DialogButton {
  index: number;
  label: string;
  class: string;
  isWarning: boolean;
  isEnabled: boolean;
}

/**
 * Confirm Dialog Component
 * Handles confirmation dialogs throughout the application
 */
export class ConfirmDialogComponent {
  private dialog: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('app-dialog-confirm, app-confirm-dialog, mat-dialog-container');
  }

  /**
   * Helper to wait for dialog, check button, title, then confirm and wait for close
   */
  static async expectDialogAndConfirm(
    page: Page,
    confirmButtonLabel: string,
    title?: string | null,
    enterNameText?: string | null
  ): Promise<void> {
    const dialog = new ConfirmDialogComponent(page);
    await dialog.waitUntilShown();

    const buttons = await dialog.getButtons();
    const confirmButton = buttons[1];
    if (confirmButton && confirmButton.label !== confirmButtonLabel) {
      throw new Error(`Expected confirm button '${confirmButtonLabel}', got '${confirmButton.label}'`);
    }

    if (title) {
      const actualTitle = await dialog.getTitle();
      if (actualTitle !== title) {
        throw new Error(`Expected title '${title}', got '${actualTitle}'`);
      }
    }

    if (enterNameText) {
      const initiallyEnabled = await dialog.confirmEnabled();
      if (initiallyEnabled) {
        throw new Error('Expected confirm to be disabled initially');
      }

      await dialog.enterConfirmText('JUNK132434325365$');
      const stillDisabled = !(await dialog.confirmEnabled());
      if (!stillDisabled) {
        throw new Error('Expected confirm to still be disabled after junk text');
      }

      await dialog.enterConfirmText(enterNameText);
      const nowEnabled = await dialog.confirmEnabled();
      if (!nowEnabled) {
        throw new Error('Expected confirm to be enabled after correct text');
      }
    }

    await dialog.confirm();
    await dialog.waitUntilNotShown();
  }

  async cancel(): Promise<void> {
    const buttons = await this.getButtons();
    if (buttons[0]) {
      const cancelButton = this.dialog.locator('button').nth(0);
      await cancelButton.click();
      await this.page.waitForTimeout(50);
    }
  }

  async confirm(): Promise<void> {
    const buttons = await this.getButtons();
    if (buttons[1]) {
      const confirmButton = this.dialog.locator('button').nth(1);
      await confirmButton.click();
      await this.page.waitForTimeout(50);
    }
  }

  async confirmEnabled(): Promise<boolean> {
    const buttons = await this.getButtons();
    return buttons[1]?.isEnabled || false;
  }

  async enterConfirmText(text: string): Promise<void> {
    const input = this.dialog.locator('input[name="typetoconfirm"], input[formcontrolname="typetoconfirm"]');
    await input.fill(text);
  }

  async getTitle(): Promise<string> {
    const title = this.dialog.locator('.confirm-dialog__header-title, mat-dialog-title');
    return await title.textContent() || '';
  }

  getMessageElement(): Locator {
    return this.dialog.locator('.confirm-dialog__message, mat-dialog-content');
  }

  async getMessage(): Promise<string> {
    return await this.getMessageElement().textContent() || '';
  }

  async waitForMessage(message: string): Promise<void> {
    await this.getMessageElement().filter({ hasText: message }).waitFor({ timeout: 5000 });
  }

  async getButtons(): Promise<DialogButton[]> {
    const buttonElements = await this.dialog.locator('button').all();
    const buttons: DialogButton[] = [];

    for (let index = 0; index < buttonElements.length; index++) {
      const btn = buttonElements[index];
      const label = await btn.textContent() || '';
      const className = await btn.getAttribute('class') || '';
      const isWarning = className.includes('mat-warn');
      const isEnabled = await btn.isEnabled();

      buttons.push({
        index,
        label: label.trim(),
        class: className,
        isWarning,
        isEnabled
      });
    }

    return buttons;
  }

  async waitUntilShown(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(250);
  }

  async waitUntilNotShown(): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden', timeout: 20000 });
  }

  async isPresent(): Promise<boolean> {
    return await this.dialog.isVisible().catch(() => false);
  }
}
