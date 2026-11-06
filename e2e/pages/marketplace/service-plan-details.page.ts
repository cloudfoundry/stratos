import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base.page';

/**
 * Service Plan Details Page
 * Displays service plan information, pricing, and features
 */
export class ServicePlanDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Get plan selector/cards container
   */
  private get planContainer(): Locator {
    return this.page.locator('app-service-plans, [class*="plan"], mat-radio-group, .plans-container').first();
  }

  /**
   * Get all plan cards/options
   */
  getPlanCards(): Locator {
    return this.page.locator('mat-radio-button, app-card, mat-card, [class*="plan-card"]').filter({ hasText: /plan|standard|free|basic|premium/i });
  }

  /**
   * Get a specific plan by name
   */
  getPlanByName(planName: string): Locator {
    return this.getPlanCards().filter({ hasText: planName }).first();
  }

  /**
   * Select a plan by name
   */
  async selectPlan(planName: string): Promise<void> {
    const plan = this.getPlanByName(planName);
    await plan.waitFor({ state: 'visible', timeout: 5000 });
    await plan.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if plan details are visible
   */
  async arePlanDetailsVisible(): Promise<boolean> {
    const details = this.page.locator(':text("description"), :text("cost"), :text("free"), :text("price")').first();
    return await details.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Get plan description
   */
  async getPlanDescription(planName: string): Promise<string | null> {
    const plan = this.getPlanByName(planName);
    const description = plan.locator('.description, [class*="desc"], p').first();

    if (await description.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await description.textContent();
    }

    return null;
  }

  /**
   * Check if pricing information is displayed
   */
  async isPricingVisible(): Promise<boolean> {
    const pricing = this.page.locator(':text("price"), :text("cost"), :text("free"), :text("$"), .pricing, .cost').first();
    return await pricing.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Get plan pricing text
   */
  async getPlanPricing(planName: string): Promise<string | null> {
    const plan = this.getPlanByName(planName);
    const pricing = plan.locator(':text("price"), :text("cost"), :text("free"), :text("$"), .pricing').first();

    if (await pricing.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await pricing.textContent();
    }

    return null;
  }

  /**
   * Check if plan features are listed
   */
  async areFeaturesVisible(): Promise<boolean> {
    const features = this.page.locator('.features, .plan-features, ul li, [class*="feature"]').first();
    return await features.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Get plan features list
   */
  async getPlanFeatures(planName: string): Promise<string[]> {
    const plan = this.getPlanByName(planName);
    const features = plan.locator('ul li, .feature, [class*="feature"]');
    const count = await features.count();
    const featureList: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await features.nth(i).textContent();
      if (text) {
        featureList.push(text.trim());
      }
    }

    return featureList;
  }

  /**
   * Filter plans by feature
   */
  async filterByFeature(feature: string): Promise<void> {
    const filterInput = this.page.locator('input[placeholder*="filter"], input[placeholder*="search"]').first();

    if (await filterInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterInput.fill(feature);
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Get count of visible plans
   */
  async getVisiblePlansCount(): Promise<number> {
    const plans = this.getPlanCards();
    return await plans.count();
  }

  /**
   * Check if a specific plan is available
   */
  async isPlanAvailable(planName: string): Promise<boolean> {
    const plan = this.getPlanByName(planName);
    return await plan.isVisible({ timeout: 2000 }).catch(() => false);
  }
}
