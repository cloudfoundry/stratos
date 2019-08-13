import { Page } from '../../po/page.po';
import { CreateAutoscalerPolicyStep } from './create-autoscaler-policy-step.po';

export class CreateAutoscalerPolicy extends Page {

  public stepper: CreateAutoscalerPolicyStep = new CreateAutoscalerPolicyStep();

  constructor(public cfGuid: string, public appGuid: string) {
    super(`/autoscaler/${cfGuid}/${appGuid}/edit-autoscaler-policy`);
  }

}
