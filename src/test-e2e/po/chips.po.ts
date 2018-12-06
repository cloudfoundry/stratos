import { by, element, ElementFinder, promise, ElementArrayFinder, browser } from 'protractor';

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

  getExpandCollapseChips(): ElementFinder {
    return this.locator.element(by.css('button.app-chips__limit'));
  }

  getExpandChips(): ElementFinder {
    return this.locator.element(by.css('button.app-chips__limit.app-chips__show-more'));
  }

  expandIfCan(): promise.Promise<any> {
    const expandCollapse = this.getExpandChips();
    return expandCollapse.isPresent().then(isPresent => {
      if (isPresent) {
        Component.scrollIntoView(expandCollapse);
        expandCollapse.click();
        return Component.waitUntilNotShown(expandCollapse);
      }
    });
  }

  getCellWithText(chipString: string): ChipComponent {
    return new ChipComponent(this.locator.element(by.cssContainingText('mat-chip', chipString)));
  }
}
