import { CFPage } from '../../po/cf-page.po';
import { QuotaFormStepper } from './quota-form-stepper.po';


export class QuotaFormPage extends CFPage {
  public stepper: QuotaFormStepper;

  constructor(url?: string) {
    super(url);
    this.stepper = new QuotaFormStepper();
  }

  submit() {
    if (this.stepper.canNext()) {
      this.stepper.next();
    }
  }
}
