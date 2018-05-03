import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by, promise } from 'protractor';
import { Component } from './component.po';



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
  select: string;
  sendKeys: Function;
  clear: Function;
  click: Function;
}

/**
 * Page Objeect for a form
 */
export class FormComponent extends Component {

  constructor(locator = element(by.tagName('form'))) {
    super(locator);
  }

  // Get metadata for all of the fields in the form
  getFields(): promise.Promise<FormItem[]> {
    return this.locator.all(by.tagName('input, mat-select')).map((elm, index) => {
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
        click: elm.click
      };
    });
  }

  // Get the form field with the specified name or formcontrolname
  getField(ctrlName: string): ElementFinder {
    return this.locator.all(by.tagName('input, mat-select')).filter((elm => {
      return elm.getAttribute('name').then(name => {
        return elm.getAttribute('formcontrolname').then(formcontrolname => {
          return (name || formcontrolname) === ctrlName;
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

  // Focus the specified field by clicking it
  focusField(ctrlName: string): promise.Promise<void> {
    return this.getField(ctrlName).click();
  }

  getControlsMap(): promise.Promise<FormItemMap> {
    return this.getFields().then(items => {
      const form = {};
      items.forEach((item: FormItem) => {
        const id = item.name || item.formControlName;
        form[id.toLowerCase()] = item;
      });
      return form;
    });
  }

  // Fill the form fields in the specified object
  fill(fields: any): promise.Promise<void> {
    return this.getControlsMap().then(ctrls => {
      Object.keys(fields).forEach(field => {
        const ctrl = ctrls[field] as FormItem;
        const value = fields[field];
        expect(ctrl).toBeDefined();
        if (ctrl.type === 'checkbox') {
          // Toggle checkbox if the value is not the desired value
          if (ctrl.checked !== value) {
            ctrl.sendKeys(' ');
          }
        } else {
          ctrl.click();
          ctrl.clear();
          ctrl.sendKeys(value);
        }
      });
    });
  }

  // Clear the specified field
  clearField(name: string): promise.Promise<void>  {
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

  constructor(public form: FormComponent, public name: string) {
    this.element = this.form.getField(name);
  }

  set(v: string): promise.Promise<void> {
    return this.form.fill( { [this.name]: v} );
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
