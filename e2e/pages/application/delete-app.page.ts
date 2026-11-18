import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Delete Application Page Object
 *
 * Deleting an app takes two phases. The /delete wizard only collects what to
 * remove along with the app (routes to delete, service bindings to unbind);
 * its finish button, "Confirm", returns to the app's detail page. The detail
 * page then opens the "Delete" confirmation dialog, and confirming that runs
 * the delete and returns to the app wall.
 */
export class DeleteApplicationPage extends BasePage {
  readonly stepper: Locator;
  readonly nextButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page, public cfGuid: string, public appGuid: string) {
    super(page);
    this.stepper = page.locator('app-steppers');
    this.nextButton = page.locator('#stepper_next');
    this.cancelButton = page.locator('#stepper_cancel');
    this.confirmDialog = page.locator('app-dialog-confirm');
  }

  private get appPath(): string {
    return `/applications/${this.cfGuid}/${this.appGuid}`;
  }

  /**
   * Go straight to the wizard and wait until it has loaded the app's routes
   * and bindings. Until both fetches land, their steps stay hidden, so a step
   * that is missing before then proves nothing.
   */
  async navigateTo(): Promise<void> {
    const loaded = this.waitForRelatedEntities();
    await this.page.goto(`${this.appPath}/delete`);
    await loaded;
    await this.waitForPage();
  }

  /** Open the wizard the way a user does: the trash button on the summary. */
  async openFromSummary(): Promise<void> {
    await this.page.goto(`${this.appPath}/summary`);
    const trash = this.page.locator('button[name="delete"]');
    await expect(trash).toBeVisible();
    const loaded = this.waitForRelatedEntities();
    await trash.click();
    await loaded;
    await this.waitForPage();
  }

  private waitForRelatedEntities(): Promise<unknown> {
    const base = `/pp/v1/cf/apps/${this.cfGuid}/${this.appGuid}`;
    return Promise.all([
      this.page.waitForResponse(r => r.url().includes(`${base}/routes`)),
      this.page.waitForResponse(r => r.url().includes(`${base}/service_bindings`)),
    ]);
  }

  async waitForPage(): Promise<void> {
    await this.page.waitForURL(new RegExp(`${this.appPath}/delete`));
    await expect(this.stepper).toBeVisible();
  }

  /**
   * Titles of the steps the wizard shows, in order. The stepper renders no
   * step headers when only one step is visible, so that case is [].
   */
  async stepTitles(): Promise<string[]> {
    const titles = await this.stepper.locator('.steppers-header-text').allTextContents();
    return titles.map(t => t.trim());
  }

  routeCheckbox(routeGuid: string): Locator {
    return this.page.locator(`input[data-test="route-checkbox"][data-guid="${routeGuid}"]`);
  }

  routeRow(routeGuid: string): Locator {
    return this.page.locator('li').filter({ has: this.routeCheckbox(routeGuid) });
  }

  bindingCheckbox(bindingGuid: string): Locator {
    return this.page.locator(`input[data-test="binding-checkbox"][data-guid="${bindingGuid}"]`);
  }

  confirmedRoutes(): Locator {
    return this.page.locator('[data-test="confirm-route"]');
  }

  confirmedBindings(): Locator {
    return this.page.locator('[data-test="confirm-binding"]');
  }

  /** Advance one step (Next), or finish on the last step (Confirm). */
  async next(): Promise<void> {
    await expect(this.nextButton).toBeEnabled();
    await this.nextButton.click();
  }

  /**
   * Step forward until the Confirm step is showing. Each step opens with a
   * fixed sentence ("Please select any attached application routes…",
   * "…service instances…", "Please confirm…"), so after each Next wait for
   * that sentence to change. Other signals mislead: a step's own content
   * re-renders after it loads, and the button label catches up a frame after
   * the content; acting on either clicks Next twice, and the second click
   * lands on Confirm and submits.
   */
  async goToConfirmStep(): Promise<void> {
    const intro = this.stepper.locator('.steppers-contents p').first();
    const read = async () => ((await intro.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    let current = await read();
    while (!current.startsWith('Please confirm')) {
      await this.next();
      await expect(intro).not.toHaveText(current);
      current = await read();
    }
    await expect(this.nextButton).toHaveText('Confirm');
  }

  /** Finish the wizard; it returns to the detail page and opens the dialog. */
  async confirmWizard(): Promise<void> {
    await this.goToConfirmStep();
    await this.next();
    await this.page.waitForURL(url => url.pathname.startsWith(this.appPath) && !url.pathname.endsWith('/delete'));
    await expect(this.confirmDialog).toBeVisible();
  }

  async confirmDeleteDialog(): Promise<void> {
    await this.confirmDialog.locator('[data-test="confirm-dialog-confirm"]').click();
  }

  async cancelDeleteDialog(): Promise<void> {
    await this.confirmDialog.locator('[data-test="confirm-dialog-cancel"]').click();
    await expect(this.confirmDialog).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
