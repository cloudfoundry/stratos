import { Page } from '../po/page.po';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { StepperComponent } from '../po/stepper.po';
import { FormComponent } from '../po/form.po';
import { protractor, promise } from 'protractor';

export class RegisterDialog extends Page {

  helpers = new E2EHelpers();

  public form = new FormComponent();

  public stepper = new StepperComponent();

  public name = this.form.getFormField('name');

  public address = this.form.getFormField('url');

  constructor() {
    super('/endpoints/register');
  }

  isRegisterDialog(): promise.Promise<boolean> {
    return this.header.getTitle().then(title => title === 'Register new Endpoint');
  }

}
