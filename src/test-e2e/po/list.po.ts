import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';

/**
 * Page Objeect for the List component
 */
export class ListComponent extends Component {

  public table: ListTableComponent;

  constructor(locator: ElementFinder = element(by.tagName('app-list'))) {
    super(locator);
    this.table = new ListTableComponent(locator);
   }

   isTableView(): promise.Promise<boolean> {
     const listElement = this.locator.element(by.css('.list-component'));
     return this.hasClass('list-component__table', listElement);
  }

  isCardsView(): promise.Promise<boolean> {
    const listElement = this.locator.element(by.css('.list-component'));
    return this.hasClass('list-component__cards', listElement);
 }

}

// Page Object for the List Table View
export class ListTableComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
   }

  getRows(): ElementArrayFinder {
    return this.locator.all(by.css('.app-table__row'));
  }

  getCell(row, column): ElementFinder {
    return this.getRows().get(row).all(by.css('.app-table__cell')).get(column);
  }

}
