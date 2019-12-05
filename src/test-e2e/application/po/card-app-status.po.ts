import { browser, by, element, ElementFinder, promise, protractor } from 'protractor';

import { e2e } from '../../e2e';
import { Component } from '../../po/component.po';

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


  waitForStatus(status: string, timeout = 40000): promise.Promise<any> {
    // This wait should cover the time between app entity created, app deployed, stratos poll gap and status change
    return browser.wait(until.textToBePresentInElement(this.getStatusLabel(), status), timeout)
      .catch(err => {
        return this.getStatusLabel().getText()
          .then(text => e2e.log(`Timed out waiting for status '${status}', last status was '${text}'`))
          .then(() => { throw err; });
      });
  }

  waitForSubStatus(subStatus: string, timeout = 40000): promise.Promise<any> {
    // This wait should cover the time between app entity created, app deployed, stratos poll gap and status change
    return browser.wait(until.textToBePresentInElement(this.getStatusSubLabel(), subStatus), timeout);
  }
}
