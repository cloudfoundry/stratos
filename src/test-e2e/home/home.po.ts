
import { E2EHelpers } from '../helpers/e2e-helpers';
import { browser, promise } from 'protractor';
import { Page } from '../po/page.po';

export class HomePage extends Page {
  helpers = new E2EHelpers();
  constructor() {
    super('/home');
  }

  navigateTo() {
    return browser.get(this.navLink);
  }

  isDashboardPage(strictCheck: boolean = true): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + this.navLink || (strictCheck && url === browser.baseUrl + '/');
    });
  }

}
