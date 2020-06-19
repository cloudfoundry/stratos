import { by, promise } from 'protractor';

import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { RadioGroup } from './radio-group.po';
import { SnackBarPo } from './snackbar.po';
import { StackedInputActionsPo } from './stacked-input-actions.po';
import { StepperComponent } from './stepper.po';

const customUserLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_USER_LABEL || process.env.USER);

export class InviteUserStepperPo extends StepperComponent {

  snackBar = new SnackBarPo();
  static createUserEmail = (isoTime?: string, postFix?: string): string => {
    const username = E2EHelpers.createCustomName(customUserLabel + (postFix || ''), isoTime).toLowerCase();
    return CFHelpers.cleanRouteHost(username) + '@e2e.com';
  }

  getStackedActions(): StackedInputActionsPo {
    return new StackedInputActionsPo(this.getComponent().element(by.css('app-stacked-input-actions')));
  }

  setSpaceRole(index: number): promise.Promise<any> {
    const rg = new RadioGroup(this.getComponent().element(by.css('.create-users__roles__space__radio-buttons')));
    return rg.select(index);
  }
}
