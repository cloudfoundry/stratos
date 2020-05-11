import { browser, by, element, promise } from 'protractor';
import { ElementArrayFinder, ElementFinder, protractor } from 'protractor/built';
import { Key } from 'selenium-webdriver';

import { Component } from './component.po';

const until = protractor.ExpectedConditions;

export interface FormItemMap {
  [k: string]: FormItem;
}

export interface FormItem {
  index: number;
  name: string;
  formControlName: string;
  placeholder: string;
  text: string;
  value: string;
  checked: boolean;
  type: string;
  class: string;
  sendKeys: Function;
  clear: Function;
  click: Function;
  tag: string;
  valid: string;
  error: string;
  id: string;
  multiple: boolean;
}

// Page Object for a form field
export class FormField {

  public element: ElementFinder;

  constructor(public form: FormComponent, public name: string) {
    this.element = this.form.getField(name);
  }

  set(v: string): promise.Promise<void> {
    return this.form.fill({ [this.name]: v });
  }

  clear(): promise.Promise<void> {
    return this.form.clearField(this.name);
  }

  isDisabled(): promise.Promise<boolean> {
    return this.form.isFieldDisabled(this.name);
  }

  isInvalid(): promise.Promise<boolean> {
    return this.form.isFieldInvalid(this.name);
  }

  getError(): promise.Promise<string> {
    return this.form.getFieldErrorText(this.name);
  }

  focus(): promise.Promise<void> {
    return this.form.focusField(this.name);
  }
}


/**
 * Page Object for a form
 */
export class FormComponent extends Component {

  constructor(locator = element(by.tagName('form'))) {
    super(locator);
  }

  // Get metadata for all of the fields in the form
  getFields(): ElementArrayFinder {
    return this.locator.all(by.tagName('input, mat-select, textarea'));
  }

  getFieldsCount(): promise.Promise<any> {
    return this.getFields().count();
  }

  getFieldsMapped(mapper?: (elm: ElementFinder, index: number) => FormItem | any): promise.Promise<FormItem[]> {
    return mapper ? this.getFields().map(mapper) : this.getFields().map(this.mapField);
  }

  // Less fields to fetch == quicker tests
  mapFieldFormFill(elm: ElementFinder, index: number): FormItem | any {
    return {
      index,
      type: elm.getAttribute('type'),
      sendKeys: elm.sendKeys,
      clear: elm.clear,
      click: elm.click,
      checked: elm.getAttribute('aria-checked').then(v => v === 'true'),
      tag: elm.getTagName(),
      multiple: elm.getAttribute('multiple'),
      id: elm.getAttribute('name').then(name => {
        if (name) {
          return name;
        } else {
          return elm.getAttribute('formcontrolname').then(controlName => {
            if (controlName) {
              return controlName;
            } else {
              return elm.getAttribute('id');
            }
          });
        }
      })
    };
  }

  mapField(elm: ElementFinder, index: number): FormItem | any {
    return {
      index,
      name: elm.getAttribute('name'),
      formControlName: elm.getAttribute('formcontrolname'),
      placeholder: elm.getAttribute('placeholder'),
      text: elm.getText(),
      value: elm.getAttribute('value'),
      checked: elm.getAttribute('aria-checked').then(v => v === 'true'),
      valid: elm.getAttribute('aria-invalid'),
      error: elm.getAttribute('aria-describedby'),
      type: elm.getAttribute('type'),
      class: elm.getAttribute('class'),
      sendKeys: elm.sendKeys,
      clear: elm.clear,
      click: elm.click,
      tag: elm.getTagName(),
      id: elm.getAttribute('id'),
      multiple: elm.getAttribute('multiple'),
    };
  }

  // Get the form field with the specified name or formcontrolname
  getField(ctrlName: string): ElementFinder {
    const fields = this.getFields();
    const newFields = fields
      .filter(elm => elm.isDisplayed())
      .filter(elm => elm.isPresent())
      .filter(elm => promise.all([
        elm.getAttribute('name'),
        elm.getAttribute('formcontrolname'),
        elm.getAttribute('id')
      ]).then(([name, formcontrolname, id]) => {
        const nameAtt = name || formcontrolname || id;
        return nameAtt.toLowerCase() === ctrlName;
      }));
    expect(newFields.count()).toBe(1);
    const field = newFields.first();
    browser.wait(until.presenceOf(field));
    return field;
  }

  // Get form field object for the specfied field (see below for FormField)
  getFormField(ctrlName: string): FormField {
    return new FormField(this, ctrlName);
  }

  // Is the specified field disabled?
  isFieldDisabled(ctrlName: string): promise.Promise<boolean> {
    return this.getField(ctrlName).getAttribute('disabled').then(v => v === 'true');
  }

  // Is the specified field invalid?
  isFieldInvalid(ctrlName: string): promise.Promise<boolean> {
    return this.getField(ctrlName).getAttribute('aria-invalid').then(v => v === 'true');
  }

  // Is the specified field invalid?
  getFieldErrorText(ctrlName: string): promise.Promise<string> {
    return this.getField(ctrlName).getAttribute('aria-describedby').then(id => this.locator.element(by.id(id)).getText());
  }

  getText = (ctrlName: string): promise.Promise<string> => {
    const field = this.getField(ctrlName);
    const isInputOrTextAreaP = field.getTagName().then(tagName => tagName === 'input' || tagName === 'textarea');
    const isMatInputFieldP = field.getAttribute('class').then(css => css.indexOf('mat-input-element') >= 0);

    return promise.all([isInputOrTextAreaP, isMatInputFieldP]).then(([isInputOrTextArea, isMatInputField]) =>
      isInputOrTextArea && isMatInputField ? field.getAttribute('value') : field.getText());
  }

  // Focus the specified field by clicking it
  focusField(ctrlName: string): promise.Promise<void> {
    return this.getField(ctrlName).click();
  }

  getControlsMap(): promise.Promise<FormItemMap> {
    return this.getFieldsMapped().then(items => {
      const form = {};
      items.forEach((item: FormItem) => {
        const id = item.name || item.formControlName || item.id;
        form[id.toLowerCase()] = item;
      });
      return form;
    });
  }

  getControlsMapFormFill(): promise.Promise<FormItemMap> {
    return this.getFieldsMapped(this.mapFieldFormFill).then(items => {
      const form = {};
      items.forEach((item: FormItem) => form[item.id.toLowerCase()] = item);
      return form;
    });
  }


  // Fill the form fields in the specified object
  fill(fields: { [fieldKey: string]: string | boolean | number[] }, expectFailure = false): promise.Promise<void> {
    return this.getControlsMapFormFill().then(ctrls => {
      Object.keys(fields).forEach(field => {
        const ctrl = ctrls[field] as FormItem;
        const value: any = fields[field];
        expect(ctrl).toBeDefined(`Could not find form control with id '${field}'. Found ctrls with ids '${Object.keys(ctrls)}'`);
        if (!ctrl) {
          return;
        }
        const type = ctrl.type || ctrl.tag;
        switch (type) {
          case 'checkbox':
            // Toggle checkbox if the value is not the desired value
            if (ctrl.checked !== value) {
              ctrl.sendKeys(' ');
            }
            break;
          case 'date':
            const datePattern = '(1|2)[0-9][0-9][0-9]/(?:(?:0[1-9])|(?:1[0-2]))/(?:(?:[0-2][1-9])|(?:[1-3][0-1]))';
            expect(new RegExp(`^${datePattern}$`).test(value)).toBe(true, `Form input '${value}' of date is invalid`);
            this.sendMultipleKeys(ctrl, value);
            break;
          case 'time':
            // TODO: These should be detected by browser/locale?
            // const timePattern = '([0-1]?[0-9]|2[0-3]):([0-5][0-9]) [AP]M';
            // expect(new RegExp(`^${timePattern}$`).test(value)).toBe(true, `Form input '${value}' of time is invalid`);
            this.sendMultipleKeys(ctrl, value);
            break;
          case 'datetime-local':
            // TODO: These should be detected by browser/locale?
            // const dateTimePattern = '(1|2)[0-9][0-9][0-9]/(?:(?:0[1-9])|(?:1[0-2]))/(?:(?:[0-2][1-9])|(?:[1-3][0-1])),([0-1]?[0-9]|2[0-3]):([0-5][0-9]) [AP]M';
            // expect(new RegExp(`^${dateTimePattern}$`).test(value)).toBe(true, `Form input '${value}' of datetime-local is invalid`);
            this.sendMultipleKeys(ctrl, value);
            break;
          case 'mat-select':
            if (ctrl.multiple) {
              expect(value instanceof Array).toBe(true, `Form input '${value}' of multiple select must be array`);
              value.sort();
              ctrl.click();
              for (let option = 1; option <= value[value.length - 1]; option++) {
                if (value.indexOf(option) >= 0) {
                  ctrl.sendKeys(Key.RETURN);
                }
                ctrl.sendKeys(Key.ARROW_DOWN);
              }
              ctrl.sendKeys(Key.ESCAPE);
              break;
            }
            let strValue = value as string;
            // Handle spaces in text. (sendKeys sends space bar.. which closes drop down)
            // Bonus - Sending string without space works... up until last character...which deselects desired option and selects top option
            const containsSpace = strValue.indexOf(' ');
            if (containsSpace >= 0) {
              strValue = strValue.slice(0, containsSpace);
            }
            ctrl.click();
            ctrl.sendKeys(strValue);
            ctrl.sendKeys(Key.RETURN);
            if (!expectFailure) {
              expect(this.getText(field)).toBe(value, `Failed to set field '${field}' with '${strValue}'`);
            } else {
              expect(this.getText(field)).not.toBe(value);
            }
            break;
          default:
            ctrl.click();
            ctrl.clear();
            ctrl.sendKeys(value);
            if (!expectFailure) {
              expect(this.getText(field)).toBe(value);
            } else {
              expect(this.getText(field)).not.toBe(value);
            }
            break;
        }
      });
    });
  }

  // Clear the specified field
  clearField(name: string): promise.Promise<void> {
    this.getField(name).click();
    this.getField(name).clear();
    // If we type something and delete, this works around an issue with clear and validation.
    this.getField(name).sendKeys(' ');
    return this.getField(name).sendKeys(protractor.Key.BACK_SPACE);
  }

  sendMultipleKeys(ctrl: FormItem, keyString: string) {
    keyString.split(/[ ,:\/]/).forEach((key) => {
      ctrl.sendKeys(key);
      if (key.length === 4) {
        ctrl.sendKeys(Key.ARROW_RIGHT);
      }
    });
    ctrl.sendKeys(Key.RETURN);
  }

}


