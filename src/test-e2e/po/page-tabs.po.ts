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
  click: () => {};
  disabled: boolean;
}

const until = protractor.ExpectedConditions;

/**
 * Page Object for page sub header component
 */
export class PageTabsPo extends Component {

  constructor(locator = element(by.css('.page-side-nav'))) {
    super(locator);
  }

  getItems(): promise.Promise<MenuItem[]> {
    return this.locator.all(by.tagName('a')).map((elm, index) => {
      return {
        index,
        label: elm.getText(),
        class: elm.getAttribute('class'),
        click: elm.click,
        disabled: elm.getAttribute('disabled').then((v => v === 'true'))
      };
    });
  }

  getItem(name: string): ElementFinder {
    return this.locator.element(by.cssContainingText('a span', new RegExp(`^${name}$`)));
  }

  clickItem(name: string): promise.Promise<void> {
    return this.getItem(name).click();
  }

  waitForItem(name: string, waitDuration?: number): promise.Promise<void> {
    const item = new Component(this.getItem(name));
    return item.waitUntilShown(`Waiting for tab: ${name} to be shown`, waitDuration);
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
