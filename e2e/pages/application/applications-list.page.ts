import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Applications List Page Object
 * Migrated from src/test-e2e/applications/applications.po.ts
 *
 * Represents the applications wall/list page
 */
export class ApplicationsPage extends BasePage {
  static FilterIds = {
    cf: 'cf',
    org: 'org',
    space: 'space'
  };

  private readonly createButton: Locator;
  private readonly listComponent: Locator;
  private readonly searchInput: Locator;
  private readonly cards: Locator;
  private readonly sideNav: Locator;

  constructor(page: Page) {
    super(page);

    this.createButton = page.locator('#appwall-create-application');
    this.listComponent = page.locator('app-list');
    this.searchInput = this.listComponent.locator('input[type="search"]');
    this.cards = this.listComponent.locator('app-card');
    this.sideNav = page.locator('app-side-nav');
  }

  /**
   * Navigate to applications page
   */
  async navigateTo(): Promise<void> {
    await this.page.goto('/applications');
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPage(): Promise<void> {
    await this.listComponent.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500); // Allow time for initial render
  }

  /**
   * Click create application button
   */
  async clickCreateApp(): Promise<void> {
    await this.createButton.waitFor({ state: 'visible' });
    await this.createButton.click();
  }

  /**
   * Navigate to application summary via side nav and search
   */
  static async goToAppSummary(
    page: Page,
    appName: string,
    cfGuid: string,
    appGuid: string
  ): Promise<void> {
    const appsPage = new ApplicationsPage(page);

    // Navigate to applications via side nav
    await appsPage.navigateTo();

    // Search for the app
    await appsPage.setSearchText(appName);

    // Verify single card found
    const searchText = await appsPage.getSearchText();
    if (searchText !== appName) {
      throw new Error(`Search text mismatch: expected "${appName}", got "${searchText}"`);
    }

    const cardCount = await appsPage.getCardCount();
    if (cardCount !== 1) {
      throw new Error(`Expected 1 card, found ${cardCount}`);
    }

    // Find and click the card
    const card = await appsPage.findCardByTitle(appName);
    await card.click();

    // Wait for navigation to summary page
    await page.waitForURL(new RegExp(`/applications/${cfGuid}/${appGuid}/summary`));
  }

  /**
   * Set search text
   */
  async setSearchText(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.page.waitForTimeout(500); // Allow search to filter
  }

  /**
   * Get current search text
   */
  async getSearchText(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  /**
   * Get count of visible cards
   */
  async getCardCount(): Promise<number> {
    return await this.cards.count();
  }

  /**
   * Find card by title
   */
  async findCardByTitle(title: string): Promise<Locator> {
    return this.cards.filter({ hasText: title }).first();
  }

  /**
   * Get all card titles
   */
  async getAllCardTitles(): Promise<string[]> {
    const cards = await this.cards.all();
    const titles: string[] = [];

    for (const card of cards) {
      const titleElement = card.locator('.card__title, .meta-card__title');
      const title = await titleElement.textContent();
      if (title) {
        titles.push(title.trim());
      }
    }

    return titles;
  }

  /**
   * Apply filter by ID
   */
  async applyFilter(filterId: string, value: string): Promise<void> {
    const filterSelect = this.listComponent.locator(`select[name="${filterId}"], mat-select[name="${filterId}"]`);
    await filterSelect.click();

    const option = this.page.locator(`mat-option`).filter({ hasText: value });
    await option.click();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    const clearButton = this.listComponent.locator('button').filter({ hasText: /clear/i });
    const isVisible = await clearButton.isVisible().catch(() => false);

    if (isVisible) {
      await clearButton.click();
    }
  }
}
