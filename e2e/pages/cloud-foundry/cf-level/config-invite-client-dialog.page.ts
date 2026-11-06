import { Page, Locator } from '@playwright/test';
import { BasePage } from '../../base.page';

/**
 * User Invite Configuration Dialog
 */
export class ConfigInviteClientDialog extends BasePage {
  private readonly dialog: Locator;
  public form: Locator;
  public buttons: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.locator('app-user-invite-configuration-dialog');
    this.form = this.dialog.locator('form');
    this.buttons = this.form;
  }

  async cancel(): Promise<void> {
    const cancelButton = this.buttons.locator('button').filter({ hasText: /cancel/i });
    await cancelButton.click();
  }

  async configure(): Promise<void> {
    const configureButton = this.buttons.locator('button').filter({ hasText: /configure/i });
    await configureButton.click();
  }

  async canConfigure(): Promise<boolean> {
    const configureButton = this.buttons.locator('button').filter({ hasText: /configure/i });
    return await configureButton.isEnabled();
  }

  async waitForSnackBar(): Promise<Locator> {
    const snackBar = this.page.locator('mat-snack-bar-container, .mat-mdc-snack-bar-container');
    await snackBar.waitFor({ state: 'visible', timeout: 5000 });
    return snackBar;
  }
}
