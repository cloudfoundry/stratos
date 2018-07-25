import { browser, promise, protractor } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { BreadcrumbsComponent } from './breadcrumbs.po';
import { PageHeader } from './page-header.po';
import { SideNavigation } from './side-nav.po';
import { PageSubHeaderComponent } from './page-subheader.po';

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
  public subHeader = new PageSubHeaderComponent();

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
      return url === this.getUrl();
    });
  }

  isActivePageOrChildPage(): promise.Promise<boolean> {
    return browser.getCurrentUrl().then(url => {
      return url.startsWith(this.getUrl());
    });
  }

  waitForPage() {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlIs(this.getUrl()), 20000);
  }

  waitForPageOrChildPage() {
    expect(this.navLink.startsWith('/')).toBeTruthy();
    browser.wait(until.urlContains(this.getUrl()), 20000);
  }


  private getUrl = () => browser.baseUrl + this.navLink;
}
