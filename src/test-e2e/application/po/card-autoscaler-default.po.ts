import { by, element, ElementFinder, promise } from 'protractor';

import { Component } from '../../po/component.po';

export class CardAutoscalerDefault extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.tagName('app-card-autoscaler-default'))) {
    super(locator);
  }

  private getRunningInstances(): ElementFinder {
    return this.locator.element(by.tagName('app-running-instances'));
  }

  getRunningInstancesText(): promise.Promise<string> {
    return this.getRunningInstances().getText();
  }

  private getDefaultMin(): ElementFinder {
    return this.locator.element(by.css('.card-autoscaler-default__min-max')).all(by.css('.metadata-item__value')).get(0);
  }

  getDefaultMinText(): promise.Promise<string> {
    return this.getDefaultMin().getText();
  }

  private getDefaultMax(): ElementFinder {
    return this.locator.element(by.css('.card-autoscaler-default__min-max')).all(by.css('.metadata-item__value')).get(1);
  }

  getDefaultMaxText(): promise.Promise<string> {
    return this.getDefaultMax().getText();
  }

}
