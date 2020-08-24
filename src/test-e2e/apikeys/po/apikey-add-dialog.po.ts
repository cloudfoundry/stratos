import { by, element } from 'protractor';

import { Component } from '../../po/component.po';
import { FormComponent } from '../../po/form.po';
import { MenuComponent } from '../../po/menu.po';

export class ApiKeyAddDialogPo extends Component {

  public form: FormComponent;

  public buttons: MenuComponent;

  constructor() {
    super(element(by.tagName('app-add-api-key-dialog')));
    this.form = new FormComponent(this.locator.element(by.css('.key-dialog')));
    this.buttons = new MenuComponent(this.locator.element(by.css('.key-dialog__actions')));
  }

  close() {
    return this.buttons.getItemMap().then(btns => btns.cancel.click());
  }

  canClose() {
    return this.buttons.getItemMap().then(btns => !btns.cancel.disabled);
  }

  create() {
    return this.buttons.getItemMap().then(btns => btns.create.click());
  }

  canCreate() {
    return this.buttons.getItemMap().then(btns => !btns.create.disabled);
  }

}
