import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';

/**
 * Page Objeect for page header
 */
export class PageHeader extends Component {

  constructor() {
    super(element(by.tagName('app-page-header')));
  }

  getIconButtons(): ElementArrayFinder {
    return this.locator.all(by.css('.page-header-right button.mat-icon-button'));
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

}
