import { promise, by, ElementFinder, element } from 'protractor';

import { Component } from './component.po';

export class CheckboxComponent extends Component {

  constructor(locator: ElementFinder = element(by.css('mat-checkbox'))) {
    super(locator);
  }

  isChecked(): promise.Promise<boolean> {
    return this.getComponent().getAttribute('class').then(cssClass => cssClass.indexOf('mat-checkbox-checked') >= 0);
  }

  isDisabled(): promise.Promise<boolean> {
    return this.locator.element(by.css(`input`)).isEnabled().then(enabled => !enabled);
  }
}
