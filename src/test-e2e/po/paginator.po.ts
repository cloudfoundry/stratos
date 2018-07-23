//
import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';

/**
 * Page Object for paginator component
 */
export class PaginatorComponent extends Component {

  constructor() {
    super(element(by.css('.mat-paginator')));
  }

  getTotalResults() {
    return this.locator.element(by.css('.mat-paginator-range-label')).getText().then(label => {
      const index = label.indexOf('of ');
      if (index > 0) {
        const value = label.substr(index + 3).trim();
        return parseInt(value, 10);
      }
      return -1;
  });
  }

}
