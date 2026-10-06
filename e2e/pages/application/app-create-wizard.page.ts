import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Application Create Wizard Page Object
 *
 * Drives the modern create wizard at /applications/create — a 3-step signal
 * stepper (app-create-application > app-steppers):
 *   1. Cloud Foundry: app-select #cf / #org / #space
 *   2. Name: input[formControlName="appName"] (+ app-error on appNameTaken)
 *   3. Create Route: domain app-select + host input
 * Navigation is the shared stepper's #stepper_next / #stepper_cancel.
 *
 * (Instances/memory/disk/buildpack/stack/health-check are NOT part of the
 * create flow anymore — those moved to /applications/deploy.)
 */
export class AppCreateWizardPage extends BasePage {
  private readonly stepper: Locator;
  private readonly nextButton: Locator;
  private readonly cancelButton: Locator;
  private readonly stepHeaders: Locator;

  constructor(page: Page) {
    super(page);
    this.stepper = page.locator('app-create-application app-steppers');
    this.stepHeaders = this.stepper.locator('.steppers-header');
    this.nextButton = page.locator('#stepper_next');
    this.cancelButton = page.locator('#stepper_cancel');
  }

  // ── Navigation ────────────────────────────────────────────────
  async navigateTo(): Promise<void> {
    await this.page.goto('/applications/create');
    await this.waitForStepper();
  }

  async waitForStepper(): Promise<void> {
    await this.stepper.waitFor({ state: 'visible', timeout: 15000 });
  }

  async isOnCreateWizard(): Promise<boolean> {
    return await this.stepper.isVisible().catch(() => false);
  }

  async getStepHeaders(): Promise<string[]> {
    return (await this.stepHeaders.allTextContents()).map(t => t.trim());
  }

  async getStepCount(): Promise<number> {
    return await this.stepHeaders.count();
  }

  // ── Step 1: CF / Org / Space (custom app-select) ──────────────
  /**
   * Drive a custom app-select (#cf/#org/#space) by visible option label.
   * Options render in a page-level overlay (.custom-option-content) and load
   * async, so retry the open+pick (each trigger click toggles the overlay).
   */
  // Each custom app-select renders its options in a listbox #select-listbox-<id>
  // that is [class.hidden]="!isOpen". The trigger and options are page-level, so
  // scope option lookups to THIS select's listbox — a page-wide .custom-option-content
  // also matches hidden options in the other (closed) selects.
  private optionsFor(id: 'cf' | 'org' | 'space'): Locator {
    return this.page.locator(`#select-listbox-${id} .custom-option-content`);
  }

  private async openSelect(id: 'cf' | 'org' | 'space'): Promise<void> {
    const trigger = this.page.locator(`app-select#${id} .select-trigger`);
    const listbox = this.page.locator(`#select-listbox-${id}`);
    // org/space stay [disabled] (pointer-events-none, toggle() no-ops) until the
    // parent selection's data finishes loading — retry the open through that
    // window rather than racing a fixed wait.
    await expect(async () => {
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
        await trigger.click({ timeout: 3000 });
      }
      await listbox.waitFor({ state: 'visible', timeout: 2000 });
    }).toPass({ timeout: 45000 }); // generous: org/space stay disabled while the
    // shared CF loads their data, which is slow under multi-worker load.
  }

  /** Real (non-"None") option labels currently in a select's listbox. */
  private async realOptionLabels(id: 'cf' | 'org' | 'space'): Promise<string[]> {
    await this.openSelect(id);
    const labels = (await this.optionsFor(id).allInnerTexts()).map(t => t.trim()).filter(t => t && t !== 'None');
    await this.page.keyboard.press('Escape').catch(() => { /* close */ });
    return labels;
  }

  /**
   * Poll a select's real options until they populate. org/space data loads
   * async AFTER the parent selection, and there is a brief enabled-but-empty
   * window, so a single read can wrongly see an empty list. Returns [] only if
   * still empty after the timeout (a CF/org with genuinely no children).
   */
  private async pollRealOptions(id: 'cf' | 'org' | 'space', timeoutMs = 25000): Promise<string[]> {
    const deadline = Date.now() + timeoutMs;
    let labels: string[] = [];
    do {
      labels = await this.realOptionLabels(id).catch(() => []);
      if (labels.length > 0) return labels;
      await this.page.waitForTimeout(600);
    } while (Date.now() < deadline);
    return labels;
  }

  private async selectOption(id: 'cf' | 'org' | 'space', label: string): Promise<void> {
    const trigger = this.page.locator(`app-select#${id} .select-trigger`);
    const option = this.optionsFor(id).filter({ hasText: label }).first();
    await expect(async () => {
      await this.openSelect(id);
      await option.waitFor({ state: 'visible', timeout: 3000 });
      await option.click({ timeout: 2000 });
      await expect(trigger).toContainText(label, { timeout: 2000 });
    }).toPass({ timeout: 30000 });
  }

  async selectCloudFoundry(name: string): Promise<void> { await this.selectOption('cf', name); }
  async selectOrg(name: string): Promise<void> { await this.selectOption('org', name); }
  async selectSpace(name: string): Promise<void> { await this.selectOption('space', name); }

  /**
   * Pick a select's "None" option. The wizard auto-picks a lone org or space,
   * so a user who sees exactly one never sees them empty; clearing explicitly
   * puts step 1 back in the unselected state whatever the CF's contents.
   */
  async clearSelection(id: 'org' | 'space'): Promise<void> {
    const none = this.optionsFor(id).filter({ hasText: /^\s*None\s*$/ }).first();
    // The auto-pick can land (and close the listbox) between open and click,
    // so retry the pair as selectOption does.
    await expect(async () => {
      await this.openSelect(id);
      await none.waitFor({ state: 'visible', timeout: 3000 });
      await none.click({ timeout: 2000 });
    }).toPass({ timeout: 30000 });
  }

  /**
   * Select the first CF endpoint whose org list actually populates. The dev
   * stack registers several CFs but only one is connected with data in the
   * browser session, and the fixture's cfGuid does not always point at it.
   * Returns { cf, org, space } — the names selected (first real org/space).
   */
  async completeStep1WithData(): Promise<{ cf: string; org: string; space: string }> {
    const cfNames = await this.realOptionLabels('cf');
    for (const cf of cfNames) {
      await this.selectCloudFoundry(cf);
      const orgs = await this.pollRealOptions('org', 15000);
      if (orgs.length === 0) continue; // not the connected CF — try the next
      // Orgs populated → THIS is the data CF. Commit to it and be patient for
      // its spaces (don't bail to an empty CF just because the space list is
      // slow under CF load).
      await this.selectOrg(orgs[0]);
      const spaces = await this.pollRealOptions('space', 40000);
      if (spaces.length === 0) throw new Error(`CF ${cf} / org ${orgs[0]} has no spaces`);
      await this.selectSpace(spaces[0]);
      return { cf, org: orgs[0], space: spaces[0] };
    }
    throw new Error('No CF endpoint has organizations in this session');
  }

  /** Select the CF with data + its first org, but NOT a space (for gating checks). */
  async selectCfAndOrgWithData(): Promise<void> {
    const cfNames = await this.realOptionLabels('cf');
    for (const cf of cfNames) {
      await this.selectCloudFoundry(cf);
      const orgs = await this.pollRealOptions('org');
      if (orgs.length === 0) continue;
      await this.selectOrg(orgs[0]);
      return;
    }
    throw new Error('No CF endpoint has organizations in this session');
  }

  /** Select the first real (non-"None") space; assumes CF+org already chosen. */
  async selectFirstRealSpace(): Promise<string> {
    const spaces = await this.pollRealOptions('space');
    if (spaces.length === 0) throw new Error('No spaces available for the selected org');
    await this.selectSpace(spaces[0]);
    return spaces[0];
  }

  /** Select the first CF that has organizations (leaves org/space empty). */
  async selectCfWithData(): Promise<void> {
    const cfNames = await this.realOptionLabels('cf');
    for (const cf of cfNames) {
      await this.selectCloudFoundry(cf);
      if ((await this.pollRealOptions('org')).length > 0) return;
    }
    throw new Error('No CF endpoint has organizations in this session');
  }

  // ── Stepper navigation ────────────────────────────────────────
  async isNextEnabled(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  async clickNext(): Promise<void> {
    await expect(this.nextButton).toBeEnabled({ timeout: 15000 });
    await this.nextButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ── Step 2: app name ──────────────────────────────────────────
  private get appNameInput(): Locator {
    return this.page.locator('app-create-application-step2 input[formcontrolname="appName"]');
  }

  async enterAppName(name: string): Promise<void> {
    await this.appNameInput.fill(name);
  }

  /** app-error shown under step 2 when the name is already taken. */
  appNameTakenError(): Locator {
    return this.page.locator('app-create-application-step2 app-error');
  }
}
