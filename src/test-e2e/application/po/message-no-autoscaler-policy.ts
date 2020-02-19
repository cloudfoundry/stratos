import { by, element, ElementFinder, promise } from 'protractor';

import { Component } from '../../po/component.po';

export class MessageNoAutoscalePolicy extends Component {

  constructor(locator: ElementFinder = element(by.tagName('app-no-content-message'))) {
    super(locator);
  }

  private getTitle(): ElementFinder {
    return this.locator.element(by.css('.first-line'));
  }

  getTitleText(): promise.Promise<string> {
    return this.getTitle().getText();
  }

  private getSubTitle(): ElementFinder {
    return this.locator.element(by.css('.second-line'));
  }

  getSubTitleText(): promise.Promise<string> {
    return this.getSubTitle().getText();
  }

}
