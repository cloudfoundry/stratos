import { Locator } from '@playwright/test';

/**
 * Chip Component
 * Individual chip
 */
export class ChipComponent {
  constructor(private chip: Locator) {}

  async getText(): Promise<string> {
    return await this.chip.textContent() || '';
  }

  async remove(): Promise<void> {
    const removeButton = this.chip.locator('mat-icon, button').filter({ hasText: /cancel|close/ });
    await removeButton.click();
  }

  async click(): Promise<void> {
    await this.chip.click();
  }
}

/**
 * Chips Component
 * Collection of material chips
 */
export class ChipsComponent {
  private chips: Locator;

  constructor(chipsLocator: Locator) {
    this.chips = chipsLocator.locator('mat-chip, .mat-mdc-chip');
  }

  async getChipCount(): Promise<number> {
    return await this.chips.count();
  }

  getChip(index: number): ChipComponent {
    return new ChipComponent(this.chips.nth(index));
  }

  async getChipByText(text: string): Promise<ChipComponent> {
    const chip = this.chips.filter({ hasText: text });
    await chip.waitFor({ state: 'visible', timeout: 5000 });
    return new ChipComponent(chip);
  }

  async getAllChipTexts(): Promise<string[]> {
    return await this.chips.allTextContents();
  }

  async removeAll(): Promise<void> {
    const count = await this.getChipCount();
    for (let i = count - 1; i >= 0; i--) {
      const chip = this.getChip(i);
      await chip.remove();
    }
  }
}
