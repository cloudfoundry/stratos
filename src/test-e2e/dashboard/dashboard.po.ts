import { protractor } from 'protractor/built';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { browser, promise } from 'protractor';

export class DashboardPage {
  helpers = new E2EHelpers();

  navigateTo() {
    return browser.get('/dashboard');
  }

  isDashboardPage(strictCheck: boolean = true): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + '/dashboard' || (strictCheck && url === browser.baseUrl + '/');
    });
  }

}
