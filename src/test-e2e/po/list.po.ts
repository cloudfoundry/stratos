import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';

/**
 * Page Objeect for list component
 */
export class ListComponent extends Component {

  public table: ListTableComponent;

  constructor(locator: ElementFinder = element(by.tagName('app-list'))) {
    super(locator);
    this.table = new ListTableComponent(locator);
   }

   isTableView() {
     const listElement = this.locator.element(by.css('.list-component'));
     return this.hasClass('list-component__table', listElement);
  }

  isCardsView() {
    const listElement = this.locator.element(by.css('.list-component'));
    return this.hasClass('list-component__cards', listElement);
 }

}

// Table View
export class ListTableComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
   }

  getRows(): ElementArrayFinder {
    return this.locator.all(by.css('.app-table__row'));
  }

  getCell(row, column) {
    return this.getRows().get(row).all(by.css('.app-table__cell')).get(column);
  }

  // getData() {
  //   return this.getRows(ele).map(function (row) {
  //     return row.all(by.css('td')).map(function (col) {
  //       return col.getText();
  //     });
  //   });
  // }

}
