import { by, element } from 'protractor';

import { Component } from './component.po';
import { ListTableComponent } from './list.po';

export class ActionMonitorComponent extends Component {

  table: ListTableComponent;

  constructor(locator = element(by.css('app-action-monitor'))) {
    super(locator);
    this.table = new ListTableComponent(this.locator);
  }
}
