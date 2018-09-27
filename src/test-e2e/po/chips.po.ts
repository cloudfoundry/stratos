import { by, element, ElementFinder, promise, ElementArrayFinder } from 'protractor';

import { ChipComponent } from './chip.po';
import { Component } from './component.po';

export class ChipsComponent extends Component {

  constructor(locator = element(by.css('app-chips'))) {
    super(locator.element(by.css('mat-chip-list')));
  }

  getChipElements(): ElementArrayFinder {
    return this.locator.all(by.tagName('mat-chip'));
  }

  getChips(): promise.Promise<ChipComponent[]> {
    return this.getChipElements().then((efs: ElementFinder[]) => efs.map((ef: ElementFinder) => new ChipComponent(ef)));
  }

  getExpandCollapseChips() {
    return this.locator.element(by.css('button.app-chips__limit'));
  }

  expandIfCan(): promise.Promise<any> {
    const expandCollapse = this.getExpandCollapseChips();
    return expandCollapse.isPresent().then(isPresent => {
      if (isPresent) {
        return expandCollapse.click();
      }
    });
  }

  getCellWithText(chipString: string): ChipComponent {
    return new ChipComponent(this.locator.element(by.cssContainingText('mat-chip', chipString)));
  }
}
