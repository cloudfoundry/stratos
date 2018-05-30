import { protractor, ElementFinder, ElementArrayFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';
import { Key, By } from 'selenium-webdriver';
import Q = require('q');



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
  // select: string;
  sendKeys: Function;
  clear: Function;
  click: Function;
  tag: string;
  valid: string;
  error: string;
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
    return this.locator.all(by.tagName('input, mat-select'));
  }

  getFieldsMapped(): promise.Promise<FormItem[]> {
    return this.getFields().map(this.mapField);
  }

  mapField(elm: ElementFinder, index: number): FormItem | any {
    return {
      index: index,
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
    };
  }

  // Get the form field with the specified name or formcontrolname
  getField(ctrlName: string): ElementFinder {
    console.log('0', ctrlName);
    return this.getFields().filter((elm => {
      console.log('1');
      return elm.getAttribute('name').then(name => {
        console.log('2', name);
        return elm.getAttribute('formcontrolname').then(formcontrolname => {
          console.log('3', formcontrolname);
          const nameAtt = name || formcontrolname;
          return nameAtt.toLowerCase() === ctrlName;
        });
      });
    })).first();
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

  getText(ctrlName: string, ctrl: FormItem): any {
    const type = ctrl.type || ctrl.tag;
    if (!!type) {
      return this.getField(ctrlName).getText();
    }
    return this.getField(ctrlName).findElement(By.css('/deep/ div:nth-of-type(2)')).getText();
  }

  // Focus the specified field by clicking it
  focusField(ctrlName: string): promise.Promise<void> {
    return this.getField(ctrlName).click();
  }

  getControlsMap(): promise.Promise<FormItemMap> {
    return this.getFieldsMapped().then(items => {
      const form = {};
      items.forEach((item: FormItem) => {
        const id = item.name || item.formControlName;
        form[id.toLowerCase()] = item;
      });
      return form;
    });
  }

  // Fill the form fields in the specified object
  fill(fields: { [fieldKey: string]: string | boolean }): promise.Promise<void> {
    return this.getControlsMap().then(ctrls => {
      Object.keys(fields).forEach(field => {
        const ctrl = ctrls[field] as FormItem;
        const value = fields[field];
        console.log(ctrls);
        console.log(fields);
        console.log(field);
        expect(ctrl).toBeDefined();
        if (!ctrl) {
          return;
        }
        // console.log(ctrl.name);
        // console.log(ctrl.tag);
        // console.log(ctrl.outerHtml);
        // ctrl.name  .element.getTagName().then(tag => console.log(tag));
        // ctrl.element.getTagName().then(tag => console.log(tag));
        // console.log('!!!!!!!!!!!!!!!!!!!!!!!', ctrl.type);
        const type = ctrl.type || ctrl.tag;
        switch (type) {
          case 'checkbox':
            // Toggle checkbox if the value is not the desired value
            if (ctrl.checked !== value) {
              ctrl.sendKeys(' ');
            }
            break;
          case 'mat-select':
            ctrl.click();
            ctrl.sendKeys(value); // TODO: RC ensure selected? find in list and click?
            ctrl.sendKeys(Key.RETURN);
            break;
          default:
            ctrl.click();
            ctrl.clear();
            ctrl.sendKeys(value);
            break;
        }
        // browser.sleep(5000);
        expect(this.getText(field, ctrl)).toBe(value);
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
}


// Page Object for a form field
export class FormField {

  public element: ElementFinder;
  public ctrl: FormItem;

  constructor(public form: FormComponent, public name: string) {
    this.element = this.form.getField(name);
    this.ctrl = this.form.mapField(this.element, 0);
    // this.form.getField()

    // const type = ctrl.type || ctrl.tag;
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
