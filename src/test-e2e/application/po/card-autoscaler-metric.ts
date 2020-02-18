import { browser, by, element, ElementArrayFinder, ElementFinder, promise, protractor } from 'protractor';

import { Component } from '../../po/component.po';
import { PageAutoscalerMetricBase } from './page-autoscaler-metric-base.po';

const until = protractor.ExpectedConditions;

export class CardAutoscalerMetric extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.autoscaler-tab__latest-metrics'))) {
    super(locator);
  }

  getMetricChartContainer(): ElementFinder {
    return this.locator.element(by.tagName('mat-card-content'));
  }

  waitForMetricsChartContainer(): promise.Promise<any> {
    return browser.wait(until.presenceOf(this.getMetricChartContainer()), 5000);
  }

  getMetricChart(index: number): ElementFinder {
    return this.getMetricCharts().get(index);
  }

  waitForMetricsChart(index: number): promise.Promise<any> {
    return browser.wait(until.presenceOf(this.getMetricChart(index)), 5000);
  }

  getMetricChartTitleText(index: number): promise.Promise<string> {
    return this.getMetricChart(index).getText();
  }

  private getMetricCharts(): ElementArrayFinder {
    return this.getMetricChartContainer().all(by.tagName('app-metadata-item'));
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
