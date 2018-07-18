import { protractor } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { browser, promise } from 'protractor';

export class MarketplacePage {
  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/marketplace');
  }

  isMarketplacePage(strictCheck: boolean = true): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      console.log(`URL is: ${url}`);
      return url === browser.baseUrl + '/marketplace' || (strictCheck && url === browser.baseUrl + '/');
    });
  }

}
