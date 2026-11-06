import { Page, Locator } from '@playwright/test';

/**
 * Tile Selector Component
 * Allows selecting from a grid of tiles
 */
export class TileSelectorComponent {
  private readonly tileSelector: Locator;

  constructor(private page: Page) {
    this.tileSelector = page.locator('app-tile-selector');
  }

  async select(tileText: string): Promise<void> {
    const tile = this.tileSelector.locator('.tile-selector__content').filter({ hasText: tileText });
    await tile.waitFor({ state: 'visible', timeout: 5000 });
    await tile.click();
  }

  async waitUntilShown(): Promise<void> {
    await this.tileSelector.waitFor({ state: 'visible', timeout: 5000 });
  }
}
