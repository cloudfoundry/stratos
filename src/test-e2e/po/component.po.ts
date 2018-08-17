import { ElementFinder, protractor } from 'protractor/built';
import { browser, promise } from 'protractor';

const until = protractor.ExpectedConditions;

/**
 * Page Object for generic base component
 */
export class Component {

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

  waitUntilNotShown(): promise.Promise<void> {
    return browser.wait(until.invisibilityOf(this.locator), 5000);
  }

  protected hasClass(cls, element = this.locator): promise.Promise<boolean> {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

}
