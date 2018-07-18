import { protractor, ElementArrayFinder, ElementFinder } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';
import { ListComponent } from '../po/list.po';

export class MarketplacePage extends Page {
  helpers = new E2EHelpers();

  servicesList = new ListComponent();

  navigateTo() {
    return browser.get('/marketplace');
  }

  isMarketplacePage(strictCheck: boolean = true): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + '/marketplace' || (strictCheck && url === browser.baseUrl + '/');
    });
  }

  getServices = (): ElementArrayFinder => {
    return this.servicesList.cards.getCards();
  }

}
