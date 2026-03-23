import { Page, Locator } from '@playwright/test';
import { FormComponent } from './form.component';
import { MenuComponent } from './menu.component';

/**
 * Card Metadata
 */
export interface CardMetadata {
  index: number;
  title: string;
}

/**
 * Table Data
 */
export interface TableData {
  [columnHeader: string]: string;
}

/**
 * List Table Component
 * Table view of list component
 */
export class ListTableComponent {
  protected table: Locator;

  constructor(protected page: Page, protected listLocator: Locator) {
    this.table = listLocator.locator('app-table, table');
  }

  async getHeaderText(): Promise<string> {
    const header = this.listLocator.locator('.list-component__header__left--text');
    return await header.textContent() || '';
  }

  getRows(): Locator {
    return this.table.locator('.app-table__row, tbody tr');
  }

  async getRowCount(): Promise<number> {
    return await this.getRows().count();
  }

  getCell(row: number, column: number): Locator {
    return this.getRows().nth(row).locator('.app-table__cell, td').nth(column);
  }

  async waitForCellText(row: number, column: number, text: string): Promise<void> {
    const cell = this.getCell(row, column);
    await cell.filter({ hasText: text }).waitFor({ timeout: 5000 });
  }

  async findRowByCellContent(content: string): Promise<Locator> {
    const cell = this.table.locator('.app-table__cell, td').filter({ hasText: content }).first();
    await cell.waitFor({ state: 'visible', timeout: 10000 });
    return cell.locator('xpath=ancestor::tr | ancestor::app-table-row');
  }

  async getTableData(): Promise<TableData[]> {
    const headers = await this.table.locator('.app-table__header-cell, th').allTextContents();
    const rows = await this.getRows().all();

    const tableData: TableData[] = [];

    for (const row of rows) {
      const cells = await row.locator('.app-table__cell, td').allTextContents();
      const rowData: TableData = {};

      cells.forEach((cellValue, index) => {
        const headerName = (headers[index] || `column-${index}`).toLowerCase();
        rowData[headerName] = cellValue.trim();
      });

      tableData.push(rowData);
    }

    return tableData;
  }

  async findRow(columnHeader: string, value: string, expected = true): Promise<number> {
    const data = await this.getTableData();
    const rowIndex = data.findIndex(row => row[columnHeader] === value);

    if (rowIndex >= 0) {
      if (!expected) {
        throw new Error(`Found row with header '${columnHeader}' and value '${value}' when not expecting one`);
      }
      return rowIndex;
    } else {
      if (expected) {
        throw new Error(`Could not find row with header '${columnHeader}' and value '${value}'`);
      }
      return -1;
    }
  }

  async selectRow(index: number, radioButton = true): Promise<void> {
    const row = this.getRows().nth(index);
    const selector = radioButton ? '.mat-radio-button' : '.mat-checkbox, mat-checkbox';
    const control = row.locator(selector);
    await control.click();
  }

  async editRow(index: number, fieldId: string, newValue: string): Promise<void> {
    const row = this.getRows().nth(index);
    const editButton = row.locator('app-table-cell-edit button, button[aria-label="edit"]');
    await editButton.click();

    const form = new FormComponent(this.page, row);
    await form.fill({ [fieldId]: newValue });

    const doneButton = row.locator('#table-cell-edit-done, button').filter({ hasText: /done|save/i });
    await doneButton.click();
  }

  async openRowActionMenuByIndex(index: number): Promise<MenuComponent> {
    const row = this.getRows().nth(index);
    return await this.openRowActionMenuByRow(row);
  }

  async openRowActionMenuByRow(row: Locator): Promise<MenuComponent> {
    const actionButton = row.locator('app-table-cell-actions button, button[aria-label="Actions"]');
    await actionButton.click();

    const menu = new MenuComponent(this.page);
    await menu.waitUntilShown();
    return menu;
  }

  async toggleSort(headerTitle: string): Promise<void> {
    const header = this.table.locator('mat-header-row app-table-cell, th').filter({ hasText: headerTitle });
    await header.click();
  }
}

/**
 * List Card Component
 * Card view of list component
 */
export class ListCardComponent {
  private static cardsCss = 'app-card:not(.row-filler), mat-card:not(.row-filler)';
  private cards: Locator;

  constructor(private page: Page, private listLocator: Locator) {
    this.cards = listLocator.locator(ListCardComponent.cardsCss);
  }

  async getCardCount(): Promise<number> {
    const noRows = this.listLocator.locator('.no-rows');
    const hasNoRows = await noRows.count();

    if (hasNoRows > 0) {
      return 0;
    }

    return await this.cards.count();
  }

  getCards(): Locator {
    return this.cards;
  }

  getCard(index: number): Locator {
    return this.cards.nth(index);
  }

  async findCardByTitle(title: string): Promise<Locator> {
    const card = this.cards.filter({ hasText: title }).first();
    await card.waitFor({ state: 'visible', timeout: 10000 });
    return card;
  }

  async getCardsMetadata(): Promise<CardMetadata[]> {
    const cardElements = await this.cards.all();
    const metadata: CardMetadata[] = [];

    for (let index = 0; index < cardElements.length; index++) {
      const card = cardElements[index];
      const titleElement = card.locator('.meta-card__title, mat-card-title');
      const title = await titleElement.textContent() || '';

      metadata.push({
        index,
        title: title.trim()
      });
    }

    return metadata;
  }
}

/**
 * List Header Component
 * Filter/search bar for lists
 */
export class ListHeaderComponent {
  private header: Locator;

  constructor(private page: Page, listLocator: Locator) {
    this.header = listLocator.locator('.list-component__header');
  }

  getFilterSection(): Locator {
    return this.header.locator('.list-component__header__left--multi-filters');
  }

  getRightHeaderSection(): Locator {
    return this.header.locator('.list-component__header__right');
  }

  getLeftHeaderSection(): Locator {
    return this.header.locator('.list-component__header__left');
  }

  getSearchInputField(): Locator {
    return this.getRightHeaderSection().locator('#listSearchFilter input, input[placeholder*="Search"]');
  }

  async setSearchText(text: string): Promise<void> {
    const searchField = this.getSearchInputField();
    await searchField.click();
    await searchField.fill('');
    await searchField.fill(text);
  }

  async clearSearchText(): Promise<void> {
    const searchField = this.getSearchInputField();
    await searchField.click();
    await searchField.fill('');
  }

  async getSearchText(): Promise<string> {
    return await this.getSearchInputField().inputValue();
  }

  getFilterFormField(id: string): Locator {
    return this.getFilterSection().locator(`#${id}`);
  }

  async getFilterText(id: string): Promise<string> {
    const field = this.getFilterFormField(id);
    const value = field.locator('.mat-select-value, .mat-mdc-select-value');
    return await value.textContent() || '';
  }

  async selectFilterOption(id: string, valueIndex: number): Promise<void> {
    const field = this.getFilterFormField(id);
    await field.click();

    const options = this.page.locator('mat-option, option');
    const option = options.nth(valueIndex);
    await option.click();
  }

  getMultiFilterForm(): FormComponent {
    return new FormComponent(this.page, this.getFilterSection());
  }

  getRefreshListButton(): Locator {
    return this.getRightHeaderSection().locator('#app-list-refresh-button, button[aria-label="Refresh"]');
  }

  async refresh(): Promise<void> {
    await this.getRefreshListButton().click();
    await this.waitForNotRefreshing();
  }

  async isRefreshing(): Promise<boolean> {
    const refreshIcon = this.getRefreshListButton().locator('.poll-icon, mat-icon');
    const animationState = await refreshIcon.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('animation-play-state')
    );
    return animationState === 'running';
  }

  async waitForRefreshing(): Promise<void> {
    await this.page.waitForTimeout(100);
    const startTime = Date.now();
    while (!(await this.isRefreshing()) && Date.now() - startTime < 5000) {
      await this.page.waitForTimeout(100);
    }
  }

  async waitForNotRefreshing(): Promise<void> {
    const startTime = Date.now();
    while (await this.isRefreshing() && Date.now() - startTime < 10000) {
      await this.page.waitForTimeout(100);
    }
  }

  getCardListViewToggleButton(): Locator {
    return this.getRightHeaderSection().locator('#list-card-toggle, button[aria-label*="view"]');
  }

  getAdd(): Locator {
    return this.header.locator('.list-component__header__right button mat-icon').filter({ hasText: 'add' });
  }

  getIconButton(iconText: string): Locator {
    return this.getLeftHeaderSection().locator('button mat-icon').filter({ hasText: iconText });
  }

  async clearFilters(): Promise<void> {
    const clearButton = this.getClearButton();
    await clearButton.click();
  }

  getClearButton(): Locator {
    return this.header.locator('.list-component__header__right button mat-icon').filter({ hasText: 'highlight_off' });
  }

  async waitUntilShown(): Promise<void> {
    await this.header.waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * List Pagination Component
 */
export class ListPaginationComponent {
  private paginator: Locator;

  constructor(private page: Page, listLocator: Locator) {
    this.paginator = listLocator.locator('.list-component__paginator, mat-paginator');
  }

  async getTotalResults(): Promise<number> {
    const label = this.paginator.locator('.paginator-info, .mat-paginator-range-label, .mat-mdc-paginator-range-label');
    const text = await label.textContent() || '';

    const match = text.match(/of\s+(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return -1;
  }

  async getPageSize(): Promise<string> {
    const select = this.paginator.locator('mat-select, select');
    return await select.textContent() || '';
  }

  async setPageSize(pageSize: string): Promise<void> {
    const isDisplayed = await this.isDisplayed();
    if (!isDisplayed) {
      return;
    }

    const select = this.paginator.locator('mat-select, select');
    await select.click();

    const option = this.page.locator('mat-option, option').filter({ hasText: pageSize });
    await option.click();
  }

  getNavFirstPage(): Locator {
    return this.paginator.locator('.mat-paginator-navigation-first, button[aria-label*="First"]');
  }

  getNavLastPage(): Locator {
    return this.paginator.locator('.mat-paginator-navigation-last, button[aria-label*="Last"]');
  }

  getNavPreviousPage(): Locator {
    return this.paginator.locator('.mat-paginator-navigation-previous, button[aria-label*="Previous"]');
  }

  getNavNextPage(): Locator {
    return this.paginator.locator('.mat-paginator-navigation-next, button[aria-label*="Next"]');
  }

  async isDisplayed(): Promise<boolean> {
    return await this.paginator.isVisible().catch(() => false);
  }
}

/**
 * List Empty Component
 */
export class ListEmptyComponent {
  private empty: Locator;

  constructor(private page: Page, listLocator: Locator) {
    this.empty = listLocator.locator('.list-component__no-entries');
  }

  getDefault(): Locator {
    return this.page.locator('.list-component__default-no-entries');
  }

  getCustom(): Locator {
    return this.page.locator('app-no-content-message');
  }

  async getCustomLineOne(): Promise<string> {
    const line = this.getCustom().locator('.first-line');
    return await line.textContent() || '';
  }
}

/**
 * List Component
 * Main list component with table/card views
 */
export class ListComponent {
  public table: ListTableComponent;
  public cards: ListCardComponent;
  public header: ListHeaderComponent;
  public pagination: ListPaginationComponent;
  public empty: ListEmptyComponent;
  public locator: Locator;

  constructor(private page: Page, locator?: Locator) {
    this.locator = locator || page.locator('app-list').first();
    this.table = new ListTableComponent(page, this.locator);
    this.cards = new ListCardComponent(page, this.locator);
    this.header = new ListHeaderComponent(page, this.locator);
    this.pagination = new ListPaginationComponent(page, this.locator);
    this.empty = new ListEmptyComponent(page, this.locator);
  }

  async isTableView(): Promise<boolean> {
    const listElement = this.locator.locator('.list-component');
    const className = (await listElement.getAttribute('class')) ?? '';
    return className.includes('list-component__table');
  }

  async isCardsView(): Promise<boolean> {
    const listElement = this.locator.locator('.list-component');
    const className = (await listElement.getAttribute('class')) ?? '';
    return className.includes('list-component__cards');
  }

  getLoadingIndicator(): Locator {
    return this.locator.locator('.list-component > .progress-bar, .list-component > mat-progress-bar');
  }

  async isLoading(): Promise<boolean> {
    return await this.getLoadingIndicator().isVisible().catch(() => false);
  }

  async waitForLoadingIndicator(): Promise<void> {
    await this.getLoadingIndicator().waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
  }

  async waitForNoLoadingIndicator(timeout = 10000): Promise<void> {
    await this.getLoadingIndicator().waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  async getTotalResults(): Promise<number> {
    const havePaginator = await this.pagination.isDisplayed();

    if (havePaginator) {
      return await this.pagination.getTotalResults();
    }

    const isCards = await this.isCardsView();
    if (isCards) {
      return await this.cards.getCardCount();
    }

    return await this.table.getRowCount();
  }

  async waitForTotalResultsToBe(count: number, timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const actual = await this.getTotalResults();
      if (actual === count) {
        return;
      }
      await this.page.waitForTimeout(100);
    }

    throw new Error(`Timed out waiting for total results to be ${count}`);
  }

  async waitUntilShown(): Promise<void> {
    await this.locator.waitFor({ state: 'visible', timeout: 10000 });
  }
}
