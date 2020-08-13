import { by, element, ElementFinder } from 'protractor';

import { Page } from '../po/page.po';

export class MarketplaceSummaryPage extends Page {

  private locator: ElementFinder;

  constructor(cfGuid: string, serviceGuid: string) {
    super(`/marketplace/${cfGuid}/${serviceGuid}/summary`);
    this.locator = element(by.css('.summary'));
  }

  getServiceSummaryCard() {
    return this.locator.element(by.css('.service-summary'));
  }

  getRecentInstances() {
    return this.locator.element(by.css('.recent-instances'));
  }

  getAddServiceInstanceButton() {
    return element(by.name('add-service-instance'));
  }


}
