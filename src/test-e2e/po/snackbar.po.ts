import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';

/**
 * Page Objeect for snack bar component
 */
export class SnackBarComponent extends Component {

  constructor() {
    super(element(by.css('.mat-simple-snackbar')));
  }

  close() {
    return this.locator.element(by.tagName('button')).click();
    // return browser.wait(protractor.until.elementIsNotVisible(this.locator.getWebElement()));
  }

  getButtonText() {
    return this.locator.element(by.tagName('button')).getText();
  }

  // The text has the button text as well - so just check that the text starts with expected text
  hasMessage(expected: string) {
    return this.locator.getText().then(actual => {
      return actual.startsWith(expected);
    });
  }

  getMessage() {
    return this.locator.getText();
  }
}
