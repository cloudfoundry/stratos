import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';
import { MenuComponent } from './menu.po';

/**
 * Page Objeect for page header
 */
export class PageHeader extends Component {

  constructor() {
    super(element(by.tagName('app-page-header')));
  }

  getIconButtons(): ElementArrayFinder {
    return this.locator.all(by.css('.page-header button.mat-icon-button'));
  }

  getIconButton(iconName: string) {
    return this.getIconButtons().map(button => {
      return button.getText();
    }).then(icons => {
      const index = icons.findIndex(name => name === iconName);
      return this.getIconButtons().get(index);
    });
  }

  clickIconButton(iconName: string) {
    return this.getIconButton(iconName).then(btn => btn.click());
  }

  hasIconButton(iconName: string) {
    return this.getIconButton(iconName).then(btn => btn && btn.isDisplayed());
  }

  logout() {
    return this.clickIconButton('more_vert').then(() => {
      browser.driver.sleep(2000);
      const menu = new MenuComponent();
      menu.waitUntilShown();
      menu.clickItem('Logout');
      browser.driver.sleep(2000);
      return browser.waitForAngular();
    });
  }

}
