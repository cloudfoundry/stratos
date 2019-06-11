import { by, element, ElementFinder, promise } from 'protractor';

import { Component } from '../../po/component.po';

export class TableAutoscalerEvents extends Component {

  constructor(locator: ElementFinder = element(by.css('.autoscaler-tile-events'))) {
    super(locator);
  }

  private getEmptyTableWarning(): ElementFinder {
    return this.locator.element(by.css('.autoscaler-tab-table-no-record'));
  }

  getEmptyTableWarningText(): promise.Promise<string> {
    return this.getEmptyTableWarning().getText();
  }

}
