import { browser, by, element, ElementFinder, promise } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { Component } from './component.po';

export enum SideNavMenuItem {
  Applications = 'Applications',
  Marketplace = 'Marketplace',
  Services = 'Services',
  CloudFoundry = 'Cloud Foundry',
  Endpoints = 'Endpoints',
}

/**
 * Page Object for side navigation
 */
export class SideNavigation extends Component {
  private helpers = new E2EHelpers();

  constructor() {
    super(element(by.tagName('app-side-nav')));
  }

  // Goto the specified menu item
  goto(menuItem: SideNavMenuItem): promise.Promise<void> {
    return this.helpers.waitForElementAndClick(this.getMenuItem(menuItem))
      .then(() => browser.actions().mouseMove({ x: 500, y: 0 }).perform())
      .then(() => browser.sleep(500));
  }

  isMenuItemPresent(menuItem: SideNavMenuItem) {
    return this.getMenuItem(menuItem).isPresent();
  }

  getMenuItem(menuItem: SideNavMenuItem): ElementFinder {
    return this.locator.element(by.cssContainingText('.side-nav__item', menuItem));
  }

}
