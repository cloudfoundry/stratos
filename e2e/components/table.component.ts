import { Page, Locator } from '@playwright/test';
import { ListTableComponent } from './list.component';

/**
 * Table Component
 * Wrapper for app-table component (extends ListTableComponent)
 */
export class TableComponent extends ListTableComponent {
  constructor(page: Page, locator?: Locator) {
    const tableLocator = locator || page.locator('app-table, table').first();
    super(page, tableLocator);
  }
}
