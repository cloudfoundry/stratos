import { StepperComponent } from '../../po/stepper.po';


export class SpaceFormStepper extends StepperComponent {

  private spaceFieldName = 'spacename';
  private quotaFieldName = 'quotadefinition';

  setSpaceName = (spaceName: string) => {
    this.getStepperForm().fill({ [this.spaceFieldName]: spaceName });
  }

  setQuotaDefinition = (quotaDefinition: string) => {
    this.getStepperForm().fill({ [this.quotaFieldName]: quotaDefinition });
  }
}
