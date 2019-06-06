import { StepperComponent } from '../../po/stepper.po';


export class OrgFormStepper extends StepperComponent {

  private orgFieldName = 'orgname';
  private quotaFieldName = 'quotadefinition';

  setOrg = (orgName: string) => {
    this.getStepperForm().fill({ [this.orgFieldName]: orgName });
  }

  setQuotaDefinition = (quotaDefinition: string) => {
    this.getStepperForm().fill({ [this.quotaFieldName]: quotaDefinition });
  }
}
