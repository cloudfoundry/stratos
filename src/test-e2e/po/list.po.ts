import { by, element, promise } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';
import { Component } from './component.po';

/**
 * Page Object for the List component
 */
export class ListComponent extends Component {

  public table: ListTableComponent;

  public cards: ListCardComponent;

  constructor(locator: ElementFinder = element(by.tagName('app-list'))) {
    super(locator);
    this.table = new ListTableComponent(locator);
    this.cards = new ListCardComponent(locator);
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


// Page Object for the List Card View
export class ListCardComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
   }

  getCards(): ElementArrayFinder {
    return this.locator.all(by.tagName('app-card'));
  }
}
