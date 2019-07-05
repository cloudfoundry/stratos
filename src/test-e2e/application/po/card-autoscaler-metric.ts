import { by, element, ElementFinder, promise, ElementArrayFinder } from 'protractor';

import { Component } from '../../po/component.po';
import { PageAutoscalerMetricBase } from './page-autoscaler-metric-base.po';

export class CardAutoscalerMetric extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.autoscaler-tab-tile-metric'))) {
    super(locator);
  }

  private getMetricChart(index: number): ElementFinder {
    return this.getMetricCharts().get(index);
  }

  getMetricChartTitleText(index: number): promise.Promise<string> {
    return this.getMetricChart(index).getText();
  }

  private getMetricCharts(): ElementArrayFinder {
    return this.locator.element(by.tagName('mat-card-content')).all(by.tagName('app-metadata-item'));
  }

  getMetricChartsCount(): promise.Promise<number> {
    return this.getMetricCharts().count();
  }

  private getGotoButton(): ElementFinder {
    return this.locator.element(by.tagName('mat-card-actions')).all(by.tagName('button')).get(1);
  }

  clickGotoMetricDashboard() {
    this.getGotoButton().click();
    return new PageAutoscalerMetricBase(this.cfGuid, this.appGuid);
  }

}
