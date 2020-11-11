import { browser, by, element as protractorElement, ElementFinder, promise, protractor } from 'protractor';
import { ElementArrayFinder } from 'protractor/built';

import { Component } from './component.po';
import { MenuComponent } from './menu.po';

/**
 * Page Object for page header
 */
export class PageHeader extends Component {

  constructor() {
    super(protractorElement(by.css('.page-content > .page-header')));
  }
  private readonly until = protractor.ExpectedConditions;
  private readonly pageTitleSelector = 'h1';

  getIconButtons(): ElementArrayFinder {
    return this.locator.all(by.css('button.mat-icon-button'));
  }

  getIconButton(iconName: string): promise.Promise<ElementFinder> {
    return this.getIconButtons()
      .map(button => button.getText())
      .then(icons => {
        const index = icons.findIndex(name => name === iconName);
        return index >= 0 ? this.getIconButtons().get(index) : null;
      });
  }

  clickIconButton(iconName: string): promise.Promise<void> {
    return this.getIconButton(iconName).then(btn => btn.click());
  }

  hasIconButton(iconName: string): promise.Promise<boolean> {
    return this.getIconButton(iconName).then(btn => btn && btn.isDisplayed());
  }

  getTitle(): ElementFinder {
    const element = this.locator.element(by.css(this.pageTitleSelector));
    browser.wait(this.until.presenceOf(element), 20000);
    return element;
  }

  getTitleText(): promise.Promise<string> {
    return this.getTitle().getText();
  }

  waitForTitleText(text: string) {
    browser.wait(this.until.textToBePresentInElement(this.getTitle(), text), 10000, `Failed to wait for page header with text ${text}`);
  }

  getUserMenu(): ElementFinder {
    return this.locator.element(by.id('userMenu'))
  }

  clickUserMenuItem(itemText: string): promise.Promise<any> {
    return this.getUserMenu()
      .click()
      .then(() => {
        // browser.driver.sleep(2000);
        const menu = new MenuComponent();
        menu.waitUntilShown();
        menu.clickItem(itemText);
        // browser.driver.sleep(2000);
        return browser.waitForAngular();
      });
  }

  logout(): promise.Promise<any> {
    return this.clickUserMenuItem('Logout');
  }

}
