import { by, element, promise, browser, protractor, Key } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';
import { Component } from './component.po';
import { MetaCard } from './meta-card.po';
import { PaginatorComponent } from './paginator.po';

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

  refresh() {
    this.locator.element(by.id('app-list-refresh-button')).click();
    const refreshIcon = element(by.css('.refresh-icon.refreshing'));
    return browser.wait(until.invisibilityOf(refreshIcon), 10000);
  }

  getTotalResults() {
    const paginator = new PaginatorComponent();
    return paginator.isDisplayed().then(havePaginator => {
      if (havePaginator) {
        return paginator.getTotalResults();
      }
      return this.isCardsView().then(haveCardsView => {
        if (haveCardsView) {
          return this.cards.getCards().count();
        }
        return this.table.getRows().count();
      });
    });
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

  // Get the data in the table
  getTableDataRaw() {
    const getHeaders = this.locator.all(by.css('.app-table__header-cell')).map(headerCell => headerCell.getText());
    const getRows = this.locator.all(by.css('.app-table__row')).map(row => row.all(by.css('.app-table__cell')).map(cell => cell.getText()));
    return promise.all([getHeaders, getRows]).then(([headers, rows]) => {
      return {
        headers,
        rows
      };
    });
  }

  getTableData() {
    return this.getTableDataRaw().then(tableData => {
      const table = [];
      tableData.rows.forEach((row: string[]) => {
        const tableRow = {};
        row.forEach((cellValue, index) => {
          const headerName = (tableData.headers[index] || 'column-' + index) as string;
          tableRow[headerName.toLowerCase()] = cellValue;
        });
        table.push(tableRow);
      });
      return table;
    });
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
    return this.locator.all(by.css('app-card:not(.row-filler)'));
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
// List Header (filter/search bar)
export class ListHeaderComponent extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getListHeader(): ElementFinder {
    return this.locator.element(by.css('.list-component__header'));
  }

  getFilterFormField(): ElementArrayFinder {
    return this.getListHeader()
      .element(by.css('.list-component__header__left--multi-filters'))
      .all(by.tagName('mat-form-field'));
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
    return this.getSearchInputField().getAttribute('value');
  }
  getPlaceholderText(index = 0): promise.Promise<string> {
    return this.getFilterFormField().get(index).element(by.tagName('mat-placeholder')).getText();
  }

  getFilterOptions(index = 0): promise.Promise<ElementFinder[]> {
    this.getFilterFormField().get(index).click();
    return element.all(by.tagName('mat-option')).then((matOptions: ElementFinder[]) => {
      return matOptions;
    });
  }

  getFilterText(index = 0): promise.Promise<string> {
    return this.getFilterFormField().get(index).element(by.css('.mat-select-value')).getText();
  }
  selectFilterOption(index: number): promise.Promise<any> {
    return this.getFilterOptions().then(options => options[index].click());
  }

  getRefreshListButton(): ElementFinder {
    return this.getRightHeaderSection().element(by.css('#app-list-refresh-button'));
  }

  getCardListViewToggleButton(): ElementFinder {
    return this.getRightHeaderSection().element(by.css('#list-card-toggle'));
  }

}
