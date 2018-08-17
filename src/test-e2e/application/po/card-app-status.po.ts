import { Component } from '../../po/component.po';
import { ElementFinder, element, by, promise, protractor, browser } from 'protractor';

const until = protractor.ExpectedConditions;

export class CardAppStatus extends Component {

  constructor(locator: ElementFinder = element(by.tagName('app-card-app-status'))) {
    super(locator);
  }

  private getStatusLabel(): ElementFinder {
    return this.locator.element(by.css('.app-state__label'));
  }

  private getStatusSubLabel(): ElementFinder {
    return this.locator.element(by.css('.app-state__sub-label'));
  }

  getStatus(): promise.Promise<{ status: string, subStatus: string }> {
    return this.getStatusSubLabel().isPresent()
      .then(haveSubLabel => {
        return promise.all([
          this.getStatusLabel().getText(),
          haveSubLabel ? this.getStatusSubLabel().getText() : promise.fullyResolved('')
        ]);
      })
      .then(([status, subStatus]: [string, string]) => {
        return { status, subStatus };
      });
  }


  waitForStatus(status: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getStatusLabel(), status));
  }
}
