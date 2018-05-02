import { protractor, ElementFinder } from 'protractor/built';
import { browser, element, by } from 'protractor';
import { Component } from './component.po';



export interface FormItemMap {
  (string): FormItem;
}

export interface FormItem {
  index: number;
  name: string;
  formControlName: string;
  placeholder: string;
  text: string;
  value: string;
  type: string;
  class: string;
  sendKeys: Function;
}

/**
 * Page Objeect a form
 */
export class FormComponent extends Component {

  constructor(locator = element(by.tagName('form'))) {
    super(locator);
  }

  getControls() {
    return this.locator.all(by.tagName('input')).map((elm, index) => {
      return {
        index: index,
        name: elm.getAttribute('name'),
        formControlName: elm.getAttribute('formcontrolname'),
        placeholder: elm.getAttribute('placeholder'),
        text: elm.getText(),
        value: elm.getAttribute('value'),
        type: elm.getAttribute('type'),
        class: elm.getAttribute('class'),
        sendKeys: elm.sendKeys
      };
    });
  }

  getItem(name: string) {
    return this.locator.element(by.cssContainingText('button', name));
  }

  clickItem(name: string) {
    return this.getItem(name).click();
  }

  // isItemEnabled(name: string) {
  //   return this.hasClass('')
  // }

  getControlsMap() {
    return this.getControls().then(items => {
      const form = {};
      items.forEach((item: FormItem) => {
        const id = item.name || item.formControlName;
        form[id.toLowerCase()] = item;
      });
      return form;
    });
  }

  // Fill the form fields in the specified object
  fill(fields: any) {
    return this.getControlsMap().then(ctrls => {
      Object.keys(fields).forEach(field => {
        const ctrl = ctrls[field];
        expect(ctrl).toBeDefined();
        ctrl.sendKeys(fields[field]);
      });
    })
  }
}
