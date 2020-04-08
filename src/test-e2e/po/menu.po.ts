import { by, element, promise } from 'protractor';
import { ElementFinder } from 'protractor/built';

import { Component } from './component.po';

export class MenuItemMap {
  [key: string]: MenuItem
}

export class MenuItem {
  index: number;
  label: string;
  class: string;
  click: () => promise.Promise<void>;
  disabled: boolean;
}
/**
 * Page Object for popup menu component
 */
export class MenuComponent extends Component {

  constructor(locator = element(by.css('.mat-menu-content'))) {
    super(locator);
  }

  getItems(): promise.Promise<MenuItem[]> {
    return this.locator.all(by.tagName('button')).map((elm, index) => {
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
    return this.locator.element(by.cssContainingText('button', name));
  }

  clickItem(name: string): promise.Promise<void> {
    return this.getItem(name).click();
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

  // Click at the very top to close the menu
  close(): promise.Promise<void> {
    return element(by.tagName('body')).click();
  }

}
