import { Component } from '../../po/component.po';
import { ElementFinder, element, by, promise, protractor, browser } from 'protractor';

const until = protractor.ExpectedConditions;

export class CardAppInstances extends Component {

  constructor(locator: ElementFinder = element(by.tagName('app-card-app-instances'))) {
    super(locator);
  }

  private getRunningInstances(): ElementFinder {
    return this.locator.element(by.tagName('app-running-instances'));
  }

  getRunningInstancesText(): promise.Promise<string> {
    return this.getRunningInstances().getText();
  }

  waitForRunningInstancesText(status: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getRunningInstances(), status));
  }
}
