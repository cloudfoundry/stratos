import { by, element, ElementFinder, promise, ElementArrayFinder } from 'protractor';

import { Component } from '../../po/component.po';

import { CreateAutoscalerPolicy } from './create-autoscaler-policy.po';
export class BannerAutoscalerTab extends Component {

  constructor(public cfGuid: string, public appGuid: string, locator: ElementFinder = element(by.css('.page-header-sub-nav__container'))) {
    super(locator);
  }

  private getEditButton(): ElementFinder {
    return this.locator.element(by.name('edit'));
  }

  getEditButtonExistence(): promise.Promise<boolean> {
    return this.getEditButton().isPresent();
  }

  private getCreateButton(): ElementFinder {
    return this.locator.element(by.name('add'));
  }

  getCreateButtonExistence(): promise.Promise<boolean> {
    return this.getCreateButton().isPresent();
  }

  private getDeleteButton(): ElementFinder {
    return this.locator.element(by.name('delete'));
  }

  getDeleteButtonExistence(): promise.Promise<boolean> {
    return this.getDeleteButton().isPresent();
  }

  private getButtons(): ElementArrayFinder {
    return this.locator.all(by.tagName('button'));
  }

  getButtonsCount(): promise.Promise<number> {
    return this.getButtons().count();
  }

  clickCreatePolicy() {
    this.getCreateButton().click();
    return new CreateAutoscalerPolicy(this.cfGuid, this.appGuid);
  }

  clickEditPolicy() {
    this.getEditButton().click();
    return new CreateAutoscalerPolicy(this.cfGuid, this.appGuid);
  }

  clickDeletePolicy() {
    this.getDeleteButton().click();
  }

}
