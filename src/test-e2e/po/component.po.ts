import { browser, promise } from 'protractor';
import { ElementFinder, protractor } from 'protractor/built';

import { E2EHelpers } from '../helpers/e2e-helpers';

const until = protractor.ExpectedConditions;

/**
 * Page Object for generic base component
 */
export class Component {

  public static waitUntilNotShown(elm, failMsg?: string): promise.Promise<void> {
    return browser.wait(until.invisibilityOf(elm), 5000, failMsg);
  }

  public static scrollIntoView(elm: ElementFinder): promise.Promise<void> {
    return new E2EHelpers().scrollIntoView(elm);
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
  waitUntilShown(elementDescription = 'Element', waitDuration = 5000): promise.Promise<void> {
    return browser.wait(until.presenceOf(this.locator), waitDuration, elementDescription + ' taking too long to appear in the DOM')
      .then(() => browser.wait(until.visibilityOf(this.locator), waitDuration, elementDescription + ' not visible timing out'))
      // Slight delay for animations
      .then(() => browser.driver.sleep(250));
  }

  waitUntilNotShown(description = 'Element'): promise.Promise<void> {
    return browser.wait(until.invisibilityOf(this.locator), 20000, description);
  }

  waitForText(text: string, elementDescription = 'Element', waitDuration = 5000) {
    return browser.wait(until.textToBePresentInElement(this.getComponent(), text), waitDuration,
      `${elementDescription} with text '${text}' taking too long to appear in the DOM`);
  }

  scrollIntoView(): promise.Promise<void> {
    return Component.scrollIntoView(this.locator);
  }

  scrollToTop(): promise.Promise<any> {
    return new E2EHelpers().scrollToTop();
  }

  scrollToBottom(): promise.Promise<any> {
    return new E2EHelpers().scrollToBottom();
  }

  protected hasClass(cls, element = this.locator): promise.Promise<boolean> {
    return element.getAttribute('class')
      .then((classes) => {
        return classes.split(' ').indexOf(cls) !== -1;
      });
  }

}
