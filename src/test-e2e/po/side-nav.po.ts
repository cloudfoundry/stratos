import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';

export enum SideNavMenuItem {
  Applications = 'Applications',
  Services = 'Services',
  CloudFoundry = 'Cloud Foundry',
  Endpoints = 'Endpoints',
}

/**
 * Page Objeect for side navigation
 */
export class SideNavigation extends Component {

  constructor() {
    super(element(by.tagName('app-side-nav')));
  }

  // Goto the specified menu item
  goto(menuItem: SideNavMenuItem) {
    return element(by.cssContainingText('.side-nav__item', menuItem)).click();
  }

}
