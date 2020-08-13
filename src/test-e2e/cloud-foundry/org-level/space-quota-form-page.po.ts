import { CFPage } from '../../po/cf-page.po';
import { SpaceQuotaFormStepper } from './space-quota-form-stepper.po';


export class SpaceQuotaFormPage extends CFPage {
  public stepper: SpaceQuotaFormStepper;

  constructor(url?: string) {
    super(url);
    this.stepper = new SpaceQuotaFormStepper();
  }

  submit() {
    if (this.stepper.canNext()) {
      this.stepper.next();
    }
  }
}
