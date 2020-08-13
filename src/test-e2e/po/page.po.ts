import { browser, by, element, promise, protractor } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { BreadcrumbsComponent } from './breadcrumbs.po';
import { LoadingIndicatorComponent } from './loading-indicator.po';
import { PageHeaderSubPo } from './page-header-sub.po';
import { PageHeader } from './page-header.po';
import { PageTabsPo } from './page-tabs.po';
import { SideNavigation } from './side-nav.po';


const until = protractor.ExpectedConditions;

/**
 * Base Page Object can be inherited by appropriate pages
 */
export abstract class Page {

  // Side navigation
  public sideNav = new SideNavigation();

  // Top header bar (if present)
  public header = new PageHeader();

  // Subheader (if present)
  public subHeader = new PageHeaderSubPo();

  // Tabs (if present)
  public tabs = new PageTabsPo();

  // Breadcrumbs (if present)
  public breadcrumbs = new BreadcrumbsComponent();

  // Loading page indicator (if present)
  public loadingIndicator = new LoadingIndicatorComponent();

  // Helpers
  public helpers = new E2EHelpers();

  constructor(public navLink?: string) { }

  navigateTo(): promise.Promise<any> {
    return browser.get(this.navLink);
  }

  isActivePage(ignoreQuery = false): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      const browserUrl = ignoreQuery ? this.stripQuery(url) : url;
      const expectedUrl = ignoreQuery ? this.stripQuery(this.getUrl()) : this.getUrl();
      return browserUrl === expectedUrl;
    });
  }

  isChildPage(childPath: string): promise.Promise<boolean> {
    if (!childPath.startsWith('/')) {
      childPath = '/' + childPath;
    }
    return browser.getCurrentUrl().then(url => {
      return url === browser.baseUrl + this.navLink + childPath;
    });
  }

  waitForPage(timeout = 20000, ignoreQuery = false) {
    expect(this.navLink.startsWith('/')).toBeTruthy('navLink should start with a /');
    if (ignoreQuery) {
      return browser.wait(() => {
        return this.isActivePage(true);
      });
    } else {
      return browser.wait(until.urlIs(this.getUrl()), timeout, `Failed to wait for page with navlink '${this.navLink}'`);
    }
  }

  waitForPageDataLoaded(timeout = 20000) {
    this.waitForPage();
    return browser.wait(until.stalenessOf(element(by.tagName('app-loading-page'))), timeout);
  }

  waitForPageOrChildPage() {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlContains(this.getUrl()), 20000);
  }

  waitForChildPage(childPath: string) {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlContains(browser.baseUrl + this.navLink + childPath), 20000);
  }
  private getUrl = () => browser.baseUrl + this.navLink;

  private stripQuery(url: string): string {
    const queryStarts = url.indexOf('?');
    return queryStarts >= 0 ? url.substring(0, queryStarts) : url;
  }
}
