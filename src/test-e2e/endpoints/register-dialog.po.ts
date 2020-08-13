import { promise } from 'protractor';

import { E2EHelpers } from '../helpers/e2e-helpers';
import { FormComponent } from '../po/form.po';
import { Page } from '../po/page.po';
import { StepperComponent } from '../po/stepper.po';

export class RegisterStepper extends Page {

  helpers = new E2EHelpers();

  public form = new FormComponent();

  public stepper = new StepperComponent();

  constructor() {
    super('/endpoints/register');
  }

  isRegisterDialog(): promise.Promise<boolean> {
    return this.header.getTitleText().then(title => title === 'Register Endpoint');
  }

  getName = () => this.form.getFormField('name');

  getAddress = () => this.form.getFormField('url');

}
