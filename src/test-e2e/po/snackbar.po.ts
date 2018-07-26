import { protractor } from 'protractor';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';
import { e2e } from '../e2e';

const until = protractor.ExpectedConditions;

/**
 * Page Object for snack bar component
 */
export class SnackBarComponent extends Component {

  constructor() {
    super(element(by.css('.mat-simple-snackbar')));
  }

  close(): promise.Promise<void> {
    return this.locator.element(by.tagName('button')).click();
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

  // Pass an optional description to help when debugging test issues
  waitUntilShown(description = 'Snackbar'): promise.Promise<void> {
    return browser.wait(until.presenceOf(this.locator), 5000,
      description + ' taking too long to appear in the DOM').then(() => {
        // Short delay for snackbar animations to finish
        e2e.sleep(250);
        return browser.wait(until.visibilityOf(this.locator), 5000, description + ' not visible timing out').then(v => {
          // Slight delay for animations
          return browser.driver.sleep(100);
        });
      });
  }
}
