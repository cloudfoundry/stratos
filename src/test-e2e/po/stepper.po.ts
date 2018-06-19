import { by, element, browser, protractor } from 'protractor';
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

  next() {
    return this.locator.element(by.id('stepper_next')).click();
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

  waitForStep(stepName: string) {
    const lastActiveHeader = element.all(by.css('.steppers__header.steppers__header--active')).last();
    return browser.wait(until.textToBePresentInElement(lastActiveHeader, stepName), 5000);
  }

  getStepperForm = (): FormComponent => new FormComponent(this.locator.element(by.className('stepper-form')));

}
