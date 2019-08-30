import { by, ElementFinder, promise } from 'protractor';

import { BooleanIndicatorComponent } from './boolean-indicator.po';
import { Component } from './component.po';
import { FormComponent } from './form.po';

export class StackedInputActionsPo extends Component {

  constructor(locator: ElementFinder) {
    super(locator);
  }

  getInputCount(): promise.Promise<number> {
    return this.getComponent().all(by.css('app-stacked-input-action')).count();
  }

  setInput(values: { [index: number]: string }): promise.Promise<any> {
    return promise.all(Object.entries<string>(values).map(([index, value]) => {
      return this.getInputForm(index as any as number).fill({ [index]: value });
    }));
  }

  getInputValue(index: number): promise.Promise<string> {
    return this.getInputForm(index).getText(index.toString());
  }

  isFieldInvalid(index: number): promise.Promise<boolean> {
    return this.getInputForm(index).isFieldInvalid(index.toString());
  }

  fieldInvalidMessage(index: number): promise.Promise<string> {
    return this.getInputForm(index).getFieldErrorText(index.toString());
  }

  clearInput(index: number): promise.Promise<any> {
    return this.getField(index).clear();
  }

  addInput(): promise.Promise<any> {
    return this.getComponent().element(by.css('.stacked-input__add')).click();
  }

  private getInput(index: number): ElementFinder {
    return this.getComponent().all(by.css('app-stacked-input-action')).get(index);
  }

  private getInputForm(index: number): FormComponent {
    return new FormComponent(this.getInput(index).element(by.css('.input-action__form')));
  }

  private getField(index: number): ElementFinder {
    return this.getInputForm(index).getField(index.toString());
  }

  removeInput(index: number): promise.Promise<any> {
    return this.getInput(index).element(by.css('.input-action__detail__remove')).click();
  }

  isInputSuccess(index: number): promise.Promise<boolean> {
    const bool = new BooleanIndicatorComponent(this.getInput(index).element(by.css('.input-action__detail')));
    return bool.getIcon().then(icon => icon === 'check_circle');
  }

  getInputMessage(index: number): promise.Promise<string> {
    return this.getInput(index).element(by.css('.input-action__detail > span')).getText();
  }
}
