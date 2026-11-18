import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Route Map Dialog Page Object
 *
 * Handles the dialog for mapping existing routes to applications
 */
export class RouteMapDialogPage extends BasePage {
  private readonly dialog: Locator;
  private readonly routeList: Locator;
  private readonly domainFilter: Locator;
  private readonly searchInput: Locator;
  private readonly mapButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // Mapping an existing route is the "attach an existing route" section of
    // the Add Route page — there is no separate dialog in the modern UI.
    this.dialog = page.locator('app-add-route-stepper').first();
    this.routeList = this.dialog.locator('[data-test="available-routes"] app-signal-list');
    this.domainFilter = this.dialog.locator('select[name="domain"]').first(); // gone in modern UI; guarded no-op
    this.searchInput = this.dialog.locator('[data-test="available-routes"] input[placeholder*="Filter"]').first();
    // Target the stepper's submit/cancel buttons by their stable ids. A
    // text regex like /create|map|attach/i is a trap here: the picker's
    // "Apps Attached" sortable column header is also a <button> and sorts
    // ahead of #stepper_next in the DOM, so `.first()` grabs the header and
    // the click sorts the list instead of submitting.
    this.mapButton = this.dialog.locator('#stepper_next');
    this.cancelButton = this.dialog.locator('#stepper_cancel');
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
   * Filter routes by domain
   */
  async filterByDomain(domainName: string): Promise<void> {
    const filterExists = await this.domainFilter.isVisible().catch(() => false);
    if (filterExists) {
      await this.domainFilter.click();
      await this.page.waitForTimeout(500);

      const option = this.page.locator('mat-option, option').filter({ hasText: domainName });
      await option.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Search for routes
   */
  async searchRoutes(searchTerm: string): Promise<void> {
    const searchExists = await this.searchInput.isVisible().catch(() => false);
    if (searchExists) {
      await this.searchInput.fill(searchTerm);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get list of available routes
   */
  getRouteList(): Locator {
    return this.routeList;
  }

  /**
   * Select a route from the list
   */
  async selectRoute(routeUrl: string): Promise<void> {
    // Narrow the list first — the route may be beyond the first page
    await this.searchInput.fill(routeUrl).catch(() => {});
    const routeItem = this.routeList.locator('tbody tr').filter({ hasText: routeUrl });
    // Rows carry a selection radio in the first cell
    await routeItem.locator('input[type="radio"]').first().click({ timeout: 30000 });
  }

  /**
   * Click map button.
   *
   * Two things conspire to swallow this click on the modern add-route page:
   *
   * 1. app-loading-page's `leaveLoaderAnimation` (250ms ease-out opacity fade,
   *    loading-page.component.ts) holds `.loading-page__overlay` in the DOM
   *    (`ng-animating`) for a quarter-second after loading completes. That
   *    fixed, full-screen z-index:1050 div still intercepts pointer events
   *    during the fade, over the button. Loading is already done — it's a
   *    cosmetic leave-animation only a machine-fast click races into (a real
   *    user's post-spinner reaction time exceeds 250ms) — so make the overlay
   *    AND its children click-transparent. `pointer-events`
   *    is not inherited, so the `*` is required: neutralising only the overlay
   *    div leaves its spinner/indicator children grabbing the click. A real
   *    click (not `dispatchEvent`, which the zoneless app ignores) then falls
   *    through to #stepper_next. Persistent style tag so it holds if the
   *    overlay reappears.
   * 2. The stepper's Map/Create button sits below the fold; scroll it to
   *    centre first so the click lands on it rather than a bottom-edge sliver.
   *
   * The button is already gated on isMapEnabled().
   */
  async clickMap(): Promise<void> {
    await this.page.addStyleTag({
      content: '.loading-page__overlay, .loading-page__overlay * { pointer-events: none !important; }',
    });
    const button = this.mapButton.first();
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 30000 });
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
   * Check if the map button is enabled — but wait out transient disabled
   * frames first. #stepper_next is `[disabled]="busy || blocked || !canGoNext"`
   * and `blocked` tracks the picker's in-flight route re-drains, which flap
   * continuously on this page. A bare `.isEnabled()` poll can land on a
   * disabled frame under CF latency (worse at 2+ workers), making callers
   * take the "cancel instead of map" branch and leaving the app unmapped.
   * Wait for it to settle enabled; only report false if it never does.
   */
  async isMapEnabled(): Promise<boolean> {
    try {
      await expect(this.mapButton.first()).toBeEnabled({ timeout: 20000 });
      return true;
    } catch {
      return false;
    }
  }
}
