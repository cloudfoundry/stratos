import { by, element, promise, browser, protractor } from 'protractor';
import { ElementArrayFinder, ElementFinder } from 'protractor/built';
import { ListTableComponent } from './list.po';

/**
 * Page Object for the App-Table component
 */
export class TableComponent extends ListTableComponent {

  constructor(locator: ElementFinder = element(by.tagName('app-table'))) {
    super(locator);
  }

}

