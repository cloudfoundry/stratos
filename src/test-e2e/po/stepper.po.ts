import { browser, by, element, promise, protractor } from 'protractor';
import { ElementFinder } from 'protractor/built';

import { Component } from './component.po';
import { FormComponent } from './form.po';

const until = protractor.ExpectedConditions;

export class StepperStep {
  index: number;
  label: string;
  class: string;
  click: Function;
  disabled: boolean;
}

/**
 * Page Object for stepper component
 */
export class StepperComponent extends Component {

  constructor(locator = element(by.tagName('app-steppers'))) {
    super(locator);
  }

  nextButton(): ElementFinder {
    return this.locator.element(by.id('stepper_next'));
  }

  next() {
    const nextButton = this.nextButton();
    // Although locally this might not seem needed it's needed in travis
    browser.executeScript('arguments[0].scrollIntoView(true)', nextButton.getWebElement());
    return nextButton.click();
  }

  cancel() {
    return this.locator.element(by.id('stepper_cancel')).click();
  }

  previous() {
    return this.locator.element(by.id('stepper_previous')).click();
  }

  isPresentNotDisabled(elm: ElementFinder) {
    return elm.isPresent().then(present => {
      return !present ? false : elm.getAttribute('disabled').then(v => {
        return v !== 'true';
      });
    });
  }

  canNext() {
    return this.isPresentNotDisabled(element(by.id('stepper_next')));
  }

  canCancel() {
    return this.isPresentNotDisabled(element(by.id('stepper_cancel')));
  }

  canPrevious() {
    return this.isPresentNotDisabled(element(by.id('stepper_previous')));
  }

  hasPrevious() {
    return element(by.id('stepper_previous')).isPresent();
  }

  getNextLabel() {
    return this.locator.element(by.id('stepper_next')).getText().then(label => label.trim());
  }

  waitUntilCanNext(nextButtonLabel = 'Close') {
    const nextButton = this.locator.element(by.id('stepper_next'));
    return browser.wait(until.textToBePresentInElement(nextButton, nextButtonLabel)).then(() => {
      return browser.wait(until.elementToBeClickable(nextButton));
    });
  }

  waitForStep(stepName: string) {
    const lastActiveHeader = this.locator.all(by.css('.steppers__header.steppers__header--active')).last();
    return browser.wait(until.textToBePresentInElement(lastActiveHeader, stepName), 5000);
  }

  // Wait until step is not busy
  waitForStepNotBusy() {
    return browser.wait(until.not(until.presenceOf(this.locator.element(by.css('.steppers__header--busy')))));
  }

  isStepDisabled(stepName: string): promise.Promise<boolean> {
    return this.getStep(stepName).element(by.css('app-dot-content span.disabled')).isPresent();
  }

  getStepperForm = (): FormComponent => new FormComponent(this.locator.element(by.className('stepper-form')));

  hasStep(name: string) {
    return this.getStep(name).isPresent();
  }

  getStepNames() {
    return this.locator.all(by.css('.steppers__header .steppers__header-text')).map(step => step.getText());
  }

  getActiveStepName(): promise.Promise<string> {
    return element(by.css('.steppers__header--active .steppers__header-text')).getText();
  }

  getStep(stepName) {
    return this.locator.element(by.cssContainingText('.steppers__header', stepName));
  }

}
