import { by, ElementFinder, promise } from 'protractor';

import { Component } from './component.po';


export class BooleanIndicatorComponent extends Component {

  /**
  * Page Object for the Boolean Indicator component
  */
  constructor(parent: ElementFinder) {
    super(parent.element(by.css('.boolean-indicator__container')));
  }

  getLabel(): promise.Promise<string> {
    return this.locator.element(by.css('div')).getText();
  }

  getIcon(): promise.Promise<string> {
    return this.locator.element(by.css('mat-icon')).getText();
  }

}
