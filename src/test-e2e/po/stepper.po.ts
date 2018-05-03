import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';
import { MenuComponent } from './menu.po';

export class StepperStep {
  index: number;
  label: string;
  class: string;
  click: Function;
  disabled: boolean;
}

/**
 * Page Objeect for stepper component
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

}
