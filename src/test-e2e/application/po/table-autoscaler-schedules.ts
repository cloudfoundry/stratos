import { by, element, ElementFinder, ElementArrayFinder, promise } from 'protractor';

import { Component } from '../../po/component.po';

export class TableAutoscalerSchedules extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.autoscaler-tab-policy-schedule'))) {
    super(locator);
  }

  private getScheduleTableTitle(): ElementFinder {
    return this.locator.element(by.css('.mat-card-title'));
  }

  getScheduleTableTitleText(): promise.Promise<string> {
    return this.getScheduleTableTitle().getText();
  }

  private getSpecificTable(): ElementFinder {
    return this.locator.element(by.css('.autoscaler-table-policy-specific'));
  }

  private getEmptySpecificTableWarning(): ElementFinder {
    return this.getSpecificTable().element(by.css('.autoscaler-tab-table-no-record'));
  }

  getEmptySpecificTableWarningText(): promise.Promise<string> {
    return this.getEmptySpecificTableWarning().getText();
  }

  private getSpecificTableRows(): ElementArrayFinder {
    return this.getSpecificTable().element(by.tagName('tbody')).all(by.tagName('tr'));
  }

  getSpecificTableRowsCount(): promise.Promise<any> {
    return this.getSpecificTableRows().count();
  }

  getSpecificTableRowCellContent(rowIndex: number, columnIndex: number): promise.Promise<any> {
    return this.getSpecificTableRows().get(rowIndex).all(by.tagName('td')).get(columnIndex).getText();
  }

  private getRecurringTable(): ElementFinder {
    return this.locator.element(by.css('.autoscaler-table-policy-recurring'));
  }

  private getEmptyRecurringTableWarning(): ElementFinder {
    return this.getRecurringTable().element(by.css('.autoscaler-tab-table-no-record'));
  }

  getEmptyRecurringTableWarningText(): promise.Promise<string> {
    return this.getEmptyRecurringTableWarning().getText();
  }

  private getRecurringTableRows(): ElementArrayFinder {
    return this.getRecurringTable().element(by.tagName('tbody')).all(by.tagName('tr'));
  }

  getRecurringTableRowsCount(): promise.Promise<any> {
    return this.getRecurringTableRows().count();
  }

  getRecurringTableRowCellContent(rowIndex: number, columnIndex: number): promise.Promise<any> {
    return this.getRecurringTableRows().get(rowIndex).all(by.tagName('td')).get(columnIndex).getText();
  }

}
