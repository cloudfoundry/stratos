import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';

const until = protractor.ExpectedConditions;

/**
 * Page Objeect for base component
 */
export abstract class Component {

  constructor(protected locator: ElementFinder) { }

  getComponent(): ElementFinder {
    return this.locator;
  }

  isPresent() {
    return this.locator.isPresent();
  }

  isDisplayed() {
    return this.locator.isDisplayed();
  }

  waitUntilShown() {
    return browser.wait(until.presenceOf(this.locator), 5000,
    'Element taking too long to appear in the DOM').then(() => {
      return browser.wait(until.visibilityOf(this.locator), 5000, 'Element not visible timing out');
    });
  }

  protected hasClass(cls, element = this.locator) {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

}
