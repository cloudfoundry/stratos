import { browser, by, element, promise, protractor } from 'protractor';
import { ElementFinder } from 'protractor/built';

import { Component } from './component.po';

export class MenuItemMap {
  [key: string]: MenuItem
}

export class MenuItem {
  index: number;
  label: string;
  class: string;
  click: Function;
  disabled: boolean;
}

const until = protractor.ExpectedConditions;

/**
 * Page Object for page sub header component
 */
export class PageSubHeaderComponent extends Component {

  constructor(locator = element(by.css('.page-subheader nav'))) {
    super(locator);
  }

  getItems(): promise.Promise<MenuItem[]> {
    return this.locator.all(by.tagName('a')).map((elm, index) => {
      return {
        index: index,
        label: elm.getText(),
        class: elm.getAttribute('class'),
        click: elm.click,
        disabled: elm.getAttribute('disabled').then((v => v === 'true'))
      };
    });
  }

  getItem(name: string): ElementFinder {
    return this.locator.element(by.cssContainingText('a', ' ' + name + ' '));
  }

  clickItem(name: string): promise.Promise<void> {
    return this.getItem(name).click();
  }

  goToItemAndWait(name: string, baseUrl: string, suffix: string): promise.Promise<any> {
    this.clickItem(name);
    if (!suffix.startsWith('/')) {
      suffix = '/' + suffix;
    }
    return browser.wait(until.urlContains(browser.baseUrl + baseUrl + suffix), 20000, `Waiting for item '${name}'`);
  }

  getItemMap(): promise.Promise<MenuItemMap> {
    return this.getItems().then(items => {
      const menuItems = {};
      items.forEach((item: MenuItem) => {
        menuItems[item.label.toLowerCase()] = item;
      });
      return menuItems;
    });
  }

}
