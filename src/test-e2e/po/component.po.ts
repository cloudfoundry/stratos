import { ElementFinder, protractor } from 'protractor/built';
import { browser, promise } from 'protractor';

const until = protractor.ExpectedConditions;

/**
 * Page Object for generic base component
 */
export class Component {

  public static waitUntilNotShown(elm): promise.Promise<void> {
    return browser.wait(until.invisibilityOf(elm), 5000);
  }

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

  // Pass an optional description to help when debugging test issues
  waitUntilShown(description = 'Element'): promise.Promise<void> {
    return browser.wait(until.presenceOf(this.locator), 5000,
      description + ' taking too long to appear in the DOM').then(() => {
        return browser.wait(until.visibilityOf(this.locator), 5000, description + ' not visible timing out').then(v => {
          // Slight delay for animations
          return browser.driver.sleep(100);
        });
      });
  }

  waitUntilNotShown(description = 'Element'): promise.Promise<void> {
    return browser.wait(until.invisibilityOf(this.locator), 20000, description);
  }

  protected hasClass(cls, element = this.locator): promise.Promise<boolean> {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

}
