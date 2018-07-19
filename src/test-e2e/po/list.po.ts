import { by, element, promise, Key } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';
import { Component } from './component.po';
import { MetaCard } from './meta-card.po';

/**
 * Page Object for the List component
 */
export class ListComponent extends Component {

  public table: ListTableComponent;

  public cards: ListCardComponent;

  public header: ListHeaderComponent;

  constructor(locator: ElementFinder = element(by.tagName('app-list'))) {
    super(locator);
    this.table = new ListTableComponent(locator);
    this.cards = new ListCardComponent(locator);
    this.header = new ListHeaderComponent(locator);
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

  getCard(index: number): MetaCard {
    return new MetaCard(this.getCards().get(index));
  }
}
// List Header (filter/search bar)
export class ListHeaderComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getListHeader(): ElementFinder {
    return this.locator.element(by.css('.list-component__header'));
  }

  getFilterFormField(): ElementFinder {
    return this.getListHeader()
    .element(by.css('.list-component__header__left--multi-filters'))
    .element(by.tagName('mat-form-field'));
  }

  getRightHeaderSection(): ElementFinder {
    return this.getListHeader().element(by.css('.list-component__header__right'));
  }
  getSearchInputField(): ElementFinder {
    return this.getRightHeaderSection().all(by.css('.filter')).first().element(by.css('input'));
  }

  setSearchText(text: string): promise.Promise<void> {
    const searchField = this.getSearchInputField();
    searchField.click();
    searchField.sendKeys(text);
    return searchField.sendKeys(Key.RETURN);
  }

  getSearchText(): promise.Promise<string> {
    return this.getSearchInputField().getAttribute('ng-reflect-model');
  }
  getPlaceholderText(): promise.Promise<string> {
    return this.getFilterFormField().element(by.tagName('mat-placeholder')).getText();
  }

  getFilterOptions(): promise.Promise<ElementFinder[]> {
    this.getFilterFormField().click();
    return element.all(by.tagName('mat-option')).then((matOptions: ElementFinder[]) => {
      return matOptions;
    });
  }

  getFilterText(): promise.Promise<string> {
    return this.getFilterFormField().element(by.css('.mat-select-value')).getText();
  }
  selectFilterOption(index: number): promise.Promise<any> {
    return this.getFilterOptions().then(options => options[index].click());
  }

  getRefreshListButton(): ElementFinder {
    return this.getRightHeaderSection().element(by.css('button'));
  }

}
