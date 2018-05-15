import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { SideNavigation } from './side-nav.po';
import { PageHeader } from './page-header.po';
import { E2EHelpers } from '../helpers/e2e-helpers';

/**
 * Base Page Object can be inherited by appropriate pages
 */
export abstract class Page {

  // Side navigation
  public sideNav = new SideNavigation();

  // Top header bar (if present)
  public header = new PageHeader();

  // Helpers
  public helpers = new E2EHelpers();

  constructor(public navLink?: string) {}

  navigateTo(): promise.Promise<any> {
    return browser.get(this.navLink);
  }

  isActivePage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + this.navLink;
    });
  }

  isActivePageOrChildPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url.startsWith(browser.baseUrl + this.navLink);
    });
  }

}
