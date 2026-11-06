import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Marketplace Page
 * Main marketplace/catalog page with services list
 */
export class MarketplacePage extends BasePage {
  public static FilterIds = {
    cf: 'cf'
  };

  private readonly servicesList: Locator;

  constructor(page: Page) {
    super(page);
    this.servicesList = page.locator('app-list, app-cards');
  }

  async navigateTo(cfGuid?: string, spaceGuid?: string): Promise<void> {
    if (cfGuid && spaceGuid) {
      await this.page.goto(`/marketplace/${cfGuid}/${spaceGuid}/services`);
    } else if (cfGuid) {
      await this.page.goto(`/marketplace/${cfGuid}`);
    } else {
      await this.page.goto('/marketplace');
    }
  }

  async waitForPage(): Promise<void> {
    await this.servicesList.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  getServices(): Locator {
    return this.servicesList.locator('app-card, mat-card');
  }

  async getServicesCount(): Promise<number> {
    return await this.getServices().count();
  }

  /**
   * Get filter/search input
   */
  getSearchInput(): Locator {
    return this.page.locator('input[placeholder*="Search"], input[placeholder*="Filter"], input[type="search"]').first();
  }

  /**
   * Filter services by search term
   */
  async filterServices(searchTerm: string): Promise<void> {
    const searchInput = this.getSearchInput();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000); // Wait for filtering
  }

  /**
   * Click on a service card by index
   */
  async selectService(index: number = 0): Promise<void> {
    const service = this.getServices().nth(index);
    await service.waitFor({ state: 'visible', timeout: 5000 });
    await service.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on a service card by name
   */
  async selectServiceByName(serviceName: string): Promise<void> {
    const service = this.getServices().filter({ hasText: serviceName }).first();
    await service.waitFor({ state: 'visible', timeout: 5000 });
    await service.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get service card by name
   */
  getServiceByName(serviceName: string): Locator {
    return this.getServices().filter({ hasText: serviceName }).first();
  }

  /**
   * Check if a specific service is visible
   */
  async isServiceVisible(serviceName: string): Promise<boolean> {
    const service = this.getServiceByName(serviceName);
    return await service.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get all visible service names
   */
  async getVisibleServiceNames(): Promise<string[]> {
    const services = this.getServices();
    const count = await services.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await services.nth(i).textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }
}
