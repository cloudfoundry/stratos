import { browser, promise, protractor } from 'protractor';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { BreadcrumbsComponent } from './breadcrumbs.po';
import { PageHeader } from './page-header.po';
import { SideNavigation } from './side-nav.po';

/**
 * Base Page Object can be inherited by appropriate pages
 */
export abstract class Page {

  // Side navigation
  public sideNav = new SideNavigation();

  // Top header bar (if present)
  public header = new PageHeader();

  // Breadcrumbs (if present)
  public breadcrumbs = new BreadcrumbsComponent();

  // Helpers
  public helpers = new E2EHelpers();

  constructor(public navLink?: string) { }

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

  protected waitFor(headerTitle: string) {
    const until = protractor.ExpectedConditions;
    browser.wait(until.textToBePresentInElement(this.header.getTitle(), headerTitle), 10000);
  }

}
