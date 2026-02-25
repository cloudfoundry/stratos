import { Page, Locator } from '@playwright/test';

/**
 * Menu Item
 */
export interface MenuItem {
  index: number;
  label: string;
  class: string;
  disabled: boolean;
}

/**
 * Menu Item Map
 */
export interface MenuItemMap {
  [key: string]: MenuItem & { click: () => Promise<void> };
}

/**
 * Menu Component
 * Popup/dropdown menu component
 */
export class MenuComponent {
  private menu: Locator;

  constructor(private page: Page, locator?: Locator) {
    this.menu = locator || page.locator('.mat-menu-content, .mat-mdc-menu-content');
  }

  async getItems(): Promise<MenuItem[]> {
    const buttonElements = await this.menu.locator('button').all();
    const items: MenuItem[] = [];

    for (let index = 0; index < buttonElements.length; index++) {
      const btn = buttonElements[index];
      const label = await btn.textContent() || '';
      const className = await btn.getAttribute('class') || '';
      const disabled = await btn.isDisabled();

      items.push({
        index,
        label: label.trim(),
        class: className,
        disabled
      });
    }

    return items;
  }

  getItem(name: string): Locator {
    return this.menu.locator('button').filter({ hasText: name });
  }

  async clickItem(name: string): Promise<void> {
    const item = this.getItem(name);
    await item.waitFor({ state: 'visible', timeout: 5000 });
    await item.click();
  }

  async getItemMap(): Promise<MenuItemMap> {
    const items = await this.getItems();
    const menuItems: MenuItemMap = {};

    for (const item of items) {
      const key = item.label.toLowerCase();
      menuItems[key] = {
        ...item,
        click: async () => {
          const btn = this.menu.locator('button').nth(item.index);
          await btn.click();
        }
      };
    }

    return menuItems;
  }

  async close(): Promise<void> {
    // Click body to close menu
    await this.page.locator('body').click({ position: { x: 0, y: 0 } });
  }

  async waitUntilShown(): Promise<void> {
    await this.menu.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.waitForTimeout(250);
  }

  async waitUntilNotShown(): Promise<void> {
    await this.menu.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async isPresent(): Promise<boolean> {
    return await this.menu.isVisible().catch(() => false);
  }
}
