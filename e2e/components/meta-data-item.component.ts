import { Page, Locator } from '@playwright/test';

/**
 * Metadata Item Component
 * Displays label-value pairs in metadata sections
 */
export class MetaDataItemComponent {
  private readonly item: Locator;

  constructor(private page: Page, item: Locator) {
    this.item = item;
  }

  /**
   * Find metadata item by label attribute
   */
  static withLabel(page: Page, locator: Locator, label: string): MetaDataItemComponent {
    const item = locator.locator(`app-metadata-item[label="${label}"]`);
    return new MetaDataItemComponent(page, item);
  }

  /**
   * Find metadata item when label can change dynamically
   */
  static withDynamicLabel(page: Page, locator: Locator, label: string): MetaDataItemComponent {
    const item = locator.locator('.metadata-item__label').filter({ hasText: label }).locator('..');
    return new MetaDataItemComponent(page, item);
  }

  async getLabel(): Promise<string> {
    return await this.item.locator('.metadata-item__label').textContent() || '';
  }

  async getValue(): Promise<string> {
    return await this.item.locator('.metadata-item__value').textContent() || '';
  }

  getBooleanIndicator(): Locator {
    return this.item.locator('.metadata-item__value .boolean-indicator__container');
  }

  async waitUntilShown(): Promise<void> {
    await this.item.waitFor({ state: 'visible', timeout: 5000 });
  }
}
