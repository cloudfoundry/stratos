import { browser, by, element, ElementFinder, promise, protractor } from 'protractor';

import { ListComponent } from '../../po/list.po';
import { Page } from '../../po/page.po';

const until = protractor.ExpectedConditions;

export class APIKeyListPage extends Page {

  list = new ListComponent();
  private locator: ElementFinder;

  constructor() {
    super('/api-keys');
    this.locator = element(by.css('app-api-keys-page'));
  }

  addKeyButton(): ElementFinder {
    return element(by.css('#stratos-api-key'));
  }


  waitForSecret(): promise.Promise<any> {
    return browser.wait(until.presenceOf(this.getKeySecret()));
  }

  getKeySecret(): ElementFinder {
    return this.locator.element(by.css('.keys-page__card li'));
  }

  closeKeySecret(): promise.Promise<void> {
    return this.locator.element(by.css('.keys-page__card button')).click();
  }
}