import { by, element, ElementFinder, ElementArrayFinder, promise } from 'protractor';

import { Component } from '../../po/component.po';

export class TableAutoscalerTriggers extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.autoscaler-tab-policy-trigger'))) {
    super(locator);
  }

  private getEmptyTableWarning(): ElementFinder {
    return this.locator.element(by.css('.autoscaler-tab-table-no-record'));
  }

  getEmptyTableWarningText(): promise.Promise<string> {
    return this.getEmptyTableWarning().getText();
  }

  private getTableRows(): ElementArrayFinder {
    return this.locator.element(by.tagName('tbody')).all(by.tagName('tr'));
  }

  getTableRowsCount(): promise.Promise<any> {
    return this.getTableRows().count();
  }

  getTableRowCellContent(rowIndex: number, columnIndex: number): promise.Promise<any> {
    return this.getTableRows().get(rowIndex).all(by.tagName('td')).get(columnIndex).getText();
  }

}
