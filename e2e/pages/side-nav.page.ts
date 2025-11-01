import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Side Navigation Menu Items
 */
export enum SideNavMenuItem {
  Applications = 'Applications',
  Marketplace = 'Marketplace',
  Services = 'Services',
  CloudFoundry = 'Cloud Foundry',
  Endpoints = 'Endpoints',
}

/**
 * Side Navigation Page Object
 * Migrated from src/test-e2e/po/side-nav.po.ts
 *
 * Handles interactions with the side navigation menu
 */
export class SideNavigation extends BasePage {
  private readonly sideNav: Locator;

  constructor(page: Page) {
    super(page);
    this.sideNav = page.locator('app-side-nav');
  }

  /**
   * Navigate to the specified menu item
   * @param menuItem The menu item to click
   */
  async goto(menuItem: SideNavMenuItem): Promise<void> {
    const menuItemLocator = this.getMenuItem(menuItem);
    await menuItemLocator.waitFor({ state: 'visible' });
    await menuItemLocator.click();

    // Move mouse away from menu (simulates original behavior)
    await this.page.mouse.move(500, 0);

    // Small delay to allow navigation to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if menu item is present
   * @param menuItem The menu item to check
   */
  async isMenuItemPresent(menuItem: SideNavMenuItem): Promise<boolean> {
    try {
      await this.getMenuItem(menuItem).waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get menu item locator
   * @param menuItem The menu item to locate
   */
  getMenuItem(menuItem: SideNavMenuItem): Locator {
    return this.sideNav.locator('.side-nav__item').filter({ hasText: menuItem });
  }
}
