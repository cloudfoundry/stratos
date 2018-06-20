import { Page } from '../po/page.po';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { StepperComponent } from '../po/stepper.po';
import { FormComponent } from '../po/form.po';
import { protractor, promise } from 'protractor';

export class RegisterDialog extends Page {

  helpers = new E2EHelpers();

  public form = new FormComponent();

  public stepper = new StepperComponent();

  constructor() {
    super('/endpoints/register');
  }

  isRegisterDialog(): promise.Promise<boolean> {
    return this.header.getTitleText().then(title => title === 'Register new Endpoint');
  }

  getName = () => this.form.getFormField('name');

  getAddress = () => this.form.getFormField('url');

}
