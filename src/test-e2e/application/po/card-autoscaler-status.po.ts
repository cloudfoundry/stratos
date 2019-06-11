import { browser, by, element, ElementFinder, promise, protractor } from 'protractor';

import { Component } from '../../po/component.po';
import { CreateAutoscalerPolicy } from './create-autoscaler-policy.po'

const until = protractor.ExpectedConditions;

export class CardAutoscalerStatus extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.id('autoscaler-card-status'))) {
    super(locator);
  }

  private getStatus(): ElementFinder {
    return this.locator.element(by.css('.mat-slide-toggle-content'));
  }

  getStatusText(): promise.Promise<string> {
    return this.getStatus().getText();
  }

  waitForStatusText(status: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getStatus(), status));
  }

  private getStatusToggle(): ElementFinder {
    return this.locator.element(by.css('.mat-slide-toggle-input'));
  }

  getStatusToggleInput(): promise.Promise<string> {
    return this.getStatusToggle().getAttribute('aria-checked');
  }

  waitForStatusToggleInput(status: string): promise.Promise<any> {
    return browser.wait(until.textToBePresentInElement(this.getStatusToggle(), status));
  }

  private getStatusToggleThumb(): ElementFinder {
    return this.locator.element(by.css('.mat-slide-toggle-thumb'));
  }

  clickAttachPolicy() {
    this.getStatusToggleThumb().click();
    return new CreateAutoscalerPolicy(this.cfGuid, this.appGuid);
  }

}
