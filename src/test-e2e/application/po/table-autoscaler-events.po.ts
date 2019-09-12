import { by, element, ElementFinder, promise, ElementArrayFinder } from 'protractor';

import { Component } from '../../po/component.po';
import { PageAutoscalerEventBase } from './page-autoscaler-event-base.po';

export class TableAutoscalerEvents extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.autoscaler-tile-events'))) {
    super(locator);
  }

  private getEmptyTableWarning(): ElementFinder {
    return this.locator.element(by.css('.autoscaler-tab-table-no-record'));
  }

  getEmptyTableWarningText(): promise.Promise<string> {
    return this.getEmptyTableWarning().getText();
  }

  private getGotoButton(): ElementFinder {
    return this.locator.element(by.tagName('mat-card-actions')).all(by.tagName('button')).get(1);
  }

  clickGotoEventPage() {
    this.getGotoButton().click();
    return new PageAutoscalerEventBase(this.cfGuid, this.appGuid);
  }

  private getRefreshButton(): ElementFinder {
    return this.locator.element(by.tagName('mat-card-actions')).all(by.tagName('button')).get(0);
  }

  clickRefreshButton() {
    this.getRefreshButton().click();
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
