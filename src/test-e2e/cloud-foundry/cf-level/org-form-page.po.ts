import { CFPage } from '../../po/cf-page.po';
import { OrgFormStepper } from './org-form-stepper.po';


export class OrgFormPage extends CFPage {
  public stepper: OrgFormStepper;

  constructor(url?: string) {
    super(url);
    this.stepper = new OrgFormStepper();
  }

  submit() {
    if (this.stepper.canNext()) {
      this.stepper.next();
    }
  }
}
