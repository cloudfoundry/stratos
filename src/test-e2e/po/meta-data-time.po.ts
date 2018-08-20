import { by, ElementFinder, promise } from 'protractor';

import { Component } from './component.po';

export class MetaDataItemComponent extends Component {

  constructor(private elementFinder: ElementFinder) {
    super(elementFinder);
  }

  public getLabel(): promise.Promise<string> {
    return this.locator.element(by.css('.metadata-item__label')).getText();
  }

  public getValue(): promise.Promise<string> {
    return this.locator.element(by.css('.metadata-item__value')).getText();
  }

}
