import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';


export class MenuItem {
  index: number;
  label: string;
  class: string;
  element: ElementFinder;
}
/**
 * Page Objeect for popup menu component
 */
export class MenuComponent extends Component {

  constructor() {
    super(element(by.css('.mat-menu-content')));
  }

  getItems() {
    return this.locator.all(by.tagName('button')).map((elm, index) => {
      return {
        index: index,
        label: elm.getText(),
        class: elm.getAttribute('class'),
        element: elm,
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
      return items;
    });
  }

}
