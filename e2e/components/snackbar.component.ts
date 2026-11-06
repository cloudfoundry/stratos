import { Page, Locator } from '@playwright/test';

/**
 * Snack Bar Component
 * Material snackbar/toast notifications
 */
export class SnackBarComponent {
  private snackbar: Locator;

  constructor(private page: Page) {
    this.snackbar = page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container, simple-snack-bar');
  }

  async getMessage(): Promise<string> {
    await this.waitUntilShown();
    return await this.snackbar.textContent() || '';
  }

  async hasMessage(message: string): Promise<boolean> {
    const text = await this.getMessage();
    return text.includes(message);
  }

  async close(): Promise<void> {
    const closeButton = this.snackbar.locator('button').filter({ hasText: /close|dismiss/i });
    const hasCloseButton = await closeButton.isVisible().catch(() => false);

    if (hasCloseButton) {
      await closeButton.click();
    }

    await this.waitUntilNotShown();
  }

  async waitUntilShown(): Promise<void> {
    await this.snackbar.waitFor({ state: 'visible', timeout: 5000 });
  }

  async waitUntilNotShown(): Promise<void> {
    await this.snackbar.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async isPresent(): Promise<boolean> {
    return await this.snackbar.isVisible().catch(() => false);
  }
}
