import { by, element, ElementFinder, promise } from 'protractor';

import { Component } from './component.po';


export class RadioGroup extends Component {

  constructor(locator = element(by.css('mat-radio-group'))) {
    super(locator);
  }

  getSelected(): ElementFinder {
    return this.locator.element(by.css('mat-radio-button.mat-radio-checked'));
  }

  select(index: number): promise.Promise<void> {
    return this.locator.all(by.css('mat-radio-button')).get(index).click();
  }
}
