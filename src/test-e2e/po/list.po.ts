import { by, element, promise, browser, protractor } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';
import { Component } from './component.po';
import { MetaCard } from './meta-card.po';
import { validateHorizontalPosition } from '@angular/cdk/overlay';

const until = protractor.ExpectedConditions;

export interface CardMetadata {
  index: number;
  title: string;
  click: Function;
}

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

  refresh() {
    this.locator.element(by.id('app-list-refresh-button')).click();
    const refreshIcon = element(by.css('.refresh-icon.refreshing'));
    return browser.wait(until.invisibilityOf(refreshIcon), 10000);
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

  getCardCound() {
    const noRows = this.locator.all(by.css('.no-rows'));
    return noRows.count().then(rows => {
      return rows === 1 ? 0 : this.getCards().count();
    });
  }

  getCards(): ElementArrayFinder {
    return this.locator.all(by.tagName('app-card'));
  }

  getCard(index: number): MetaCard {
    return new MetaCard(this.getCards().get(index));
  }

  findCardByTitle(title: string): promise.Promise<MetaCard> {
    return this.getCards().filter((elem) => {
      return elem.element(by.cssContainingText('.meta-card__title', title)).isPresent();
    }).then(e => {
      expect(e.length).toBe(1);
      return new MetaCard(e[0]);
    });
  }

  getCardsMetadata(): promise.Promise<CardMetadata[]> {
    return this.getCards().map((elem, index) => {
      return {
        index: index,
        title: elem.element(by.css('.meta-card__title')).getText(),
        click: elem.click,
      };
    });
  }

}
