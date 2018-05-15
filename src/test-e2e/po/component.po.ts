import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';

const until = protractor.ExpectedConditions;

/**
 * Page Object for generic base component
 */
export abstract class Component {

  constructor(protected locator: ElementFinder) { }

  getComponent(): ElementFinder {
    return this.locator;
  }

  isPresent(): promise.Promise<boolean> {
    return this.locator.isPresent();
  }

  isDisplayed(): promise.Promise<boolean> {
    return this.locator.isDisplayed();
  }

  waitUntilShown(): promise.Promise<void> {
    return browser.wait(until.presenceOf(this.locator), 5000,
    'Element taking too long to appear in the DOM').then(() => {
      return browser.wait(until.visibilityOf(this.locator), 5000, 'Element not visible timing out').then(v => {
        // Slight delay for animations
        return browser.driver.sleep(100);
      });
    });
  }

  protected hasClass(cls, element = this.locator): promise.Promise<boolean> {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

}
