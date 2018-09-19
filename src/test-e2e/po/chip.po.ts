import { by, ElementFinder, promise } from 'protractor';

import { Component } from './component.po';

export class ChipComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getCross(): ElementFinder {
    return this.locator.element(by.css('mat-icon'));
  }

  getText(): promise.Promise<string> {
    return this.locator.getText();
  }
}
