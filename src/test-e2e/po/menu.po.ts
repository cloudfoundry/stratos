import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';


export class MenuItem {
  index: number;
  label: string;
  class: string;
  click: Function;
  disabled: boolean;
}
/**
 * Page Objeect for popup menu component
 */
export class MenuComponent extends Component {

  constructor(locator = element(by.css('.mat-menu-content'))) {
    super(locator);
  }

  getItems() {
    return this.locator.all(by.tagName('button')).map((elm, index) => {
      return {
        index: index,
        label: elm.getText(),
        class: elm.getAttribute('class'),
        click: elm.click,
        disabled: elm.getAttribute('disabled').then((v => v === 'true'))
      };
    });
  }

  getItem(name: string) {
    return this.locator.element(by.cssContainingText('button', name));
  }

  clickItem(name: string) {
    return this.getItem(name).click();
  }

  // isItemEnabled(name: string) {
  //   return this.hasClass('')
  // }

  getItemMap() {
    return this.getItems().then(items => {
      const menuItems = {};
      items.forEach((item: MenuItem) => {
        menuItems[item.label.toLowerCase()] = item;
      });
      return menuItems;
    });
  }

  // Click at the very top to close the menu
  close() {
    element(by.tagName('body')).click();
  }

}
