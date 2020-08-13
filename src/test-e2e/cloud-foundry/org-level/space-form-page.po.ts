import { CFPage } from '../../po/cf-page.po';
import { SpaceFormStepper } from './space-form-stepper.po';


export class SpaceFormPage extends CFPage {
  public stepper: SpaceFormStepper;

  constructor(url?: string) {
    super(url);
    this.stepper = new SpaceFormStepper();
  }

  submit() {
    if (this.stepper.canNext()) {
      this.stepper.next();
    }
  }
}
