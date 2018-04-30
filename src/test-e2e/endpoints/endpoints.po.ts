import { protractor } from 'protractor/built';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { browser, promise } from 'protractor';

export class EndpointsPage {
  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/endpoints');
  }

  isEndpointsPage(strictCheck: boolean = true): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + '/endpoints' || (strictCheck && url === browser.baseUrl + '/');
    });
  }

}
