import { by, element } from 'protractor';

import { Component } from '../po/component.po';
import { FormComponent } from '../po/form.po';
import { MenuComponent } from '../po/menu.po';

/**
 * Connect Dialog Page Object
 */
export class ConnectDialogComponent extends Component {

  public form: FormComponent;

  public buttons: MenuComponent;

  constructor() {
    super(element(by.tagName('app-connect-endpoint-dialog')));
    this.form = new FormComponent(this.locator.element(by.tagName('form')));
    this.buttons = new MenuComponent(this.locator.element(by.css('.connection-dialog__actions')));
  }

  close() {
    return this.buttons.getItemMap().then(btns => btns.cancel.click());
  }

  connect() {
    return this.buttons.getItemMap().then(btns => btns.connect.click());
  }

  canConnect() {
    return this.buttons.getItemMap().then(btns => !btns.connect.disabled);
  }


}
