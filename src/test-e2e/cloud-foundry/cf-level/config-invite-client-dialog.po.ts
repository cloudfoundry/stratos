import { by, element, promise } from 'protractor';

import { Component } from '../../po/component.po';
import { FormComponent } from '../../po/form.po';
import { MenuComponent } from '../../po/menu.po';
import { SnackBarPo } from '../../po/snackbar.po';

export class ConfigInviteClientDialog extends Component {

  public form: FormComponent;

  public buttons: MenuComponent;

  public snackBar = new SnackBarPo();

  constructor() {
    super(element(by.tagName('app-user-invite-configuration-dialog')));
    this.form = new FormComponent(this.locator.element(by.tagName('form')));
    this.buttons = new MenuComponent(this.locator.element(by.tagName('form')));
  }

  cancel(): promise.Promise<any> {
    return this.buttons.getItemMap().then(btns => btns.cancel.click());
  }

  configure(): promise.Promise<any> {
    return this.buttons.getItemMap().then(btns => btns.configure.click());
  }

  canConfigure(): promise.Promise<boolean> {
    return this.buttons.getItemMap().then(btns => !btns.configure.disabled);
  }

}
