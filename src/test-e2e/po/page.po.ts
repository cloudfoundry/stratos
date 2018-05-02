import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { SideNavigation } from './side-nav.po';
import { PageHeader } from './page-header.po';
import { E2EHelpers } from '../helpers/e2e-helpers';

/**
 * Base Page Objeect can be inherited by appropriate pages
 */
export abstract class Page {

  // Side navigation
  public sideNav = new SideNavigation();

  // Top header bar (if present)
  public header = new PageHeader();

  // Helpers
  public helpers = new E2EHelpers();

  constructor(public navLink?: string) {}

  navigateTo() {
    return browser.get(this.navLink);
  }

  isActivePage() {
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + this.navLink;
    });
  }

  isActivePageOrChildPage() {
    return browser.getCurrentUrl().then(url => {
      return url.startsWith(browser.baseUrl + this.navLink);
    });
  }

}
