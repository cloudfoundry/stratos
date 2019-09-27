import { browser, by, element as protractorElement, ElementFinder, promise, protractor } from 'protractor';
import { ElementArrayFinder } from 'protractor/built';

import { Component } from './component.po';


/**
 * Contains page title & actions
 */
export class PageHeaderSubPo extends Component {

  constructor() {
    super(protractorElement(by.css('.page-header-sub-nav')));
  }

  private readonly until = protractor.ExpectedConditions;

  getItem(iconName: string): promise.Promise<ElementFinder> {
    return this.getIconButton(iconName);
  }

  goToItemAndWait(iconName: string, baseUrl: string, suffix: string): promise.Promise<any> {
    this.clickIconButton(iconName);
    if (!suffix.startsWith('/')) {
      suffix = '/' + suffix;
    }
    return browser.wait(this.until.urlContains(browser.baseUrl + baseUrl + suffix), 20000, `Waiting for item '${name}'`);
  }

  getIconButtons(): ElementArrayFinder {
    return this.locator.all(by.css('.page-header-sub-nav__container button mat-icon'));
  }

  getIconButton(iconName: string): promise.Promise<ElementFinder> {
    return this.getIconButtons()
      .map(button => button.getText())
      .then(icons => {
        const index = icons.findIndex(name => name === iconName);
        return index >= 0 ? this.getIconButtons().get(index) : null;
      });
  }

  waitForIconButton(iconName: string): promise.Promise<void> {
    return browser.wait(
      this.until.presenceOf(this.locator.element(by.cssContainingText('.page-header-sub-nav__container button mat-icon', iconName)))
    );
  }

  clickIconButton(iconName: string): promise.Promise<void> {
    return this.waitForIconButton(iconName).then(() => this.getIconButton(iconName).then(btn => btn.click()));
  }

  hasIconButton(iconName: string): promise.Promise<boolean> {
    return this.getIconButton(iconName).then(btn => btn && btn.isDisplayed());
  }

  getTitle(): ElementFinder {
    const element = this.locator.element(by.css('.page-header-sub-nav__title'));
    browser.wait(this.until.presenceOf(element), 20000);
    return element;
  }

  getTitleText(): promise.Promise<string> {
    return this.getTitle().getText();
  }

  waitForTitleText(text: string) {
    browser.wait(this.until.textToBePresentInElement(this.getTitle(), text), 10000, `Failed to wait for page header with text ${text}`);
  }


}
