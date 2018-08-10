import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';

/**
 * Page Object for snack bar component
 */
export class SnackBarComponent extends Component {

  constructor() {
    super(element(by.css('.mat-simple-snackbar')));
  }

  private getButton(): ElementFinder {
    return this.locator.element(by.tagName('button'));
  }

  close(): promise.Promise<void> {
    return this.getButton().click();
  }

  safeClose(): promise.Promise<void> {
    return this.getButton().isPresent().then(isPresent => {
      return isPresent ? this.getButton().click() : null;
    });
  }

  getButtonText(): promise.Promise<string> {
    return this.locator.element(by.tagName('button')).getText();
  }

  // The text has the button text as well - so just check that the text starts with expected text
  hasMessage(expected: string): promise.Promise<boolean> {
    return this.locator.getText().then(actual => {
      return actual.startsWith(expected);
    });
  }

  getMessage(): promise.Promise<string> {
    return this.locator.getText();
  }
}
