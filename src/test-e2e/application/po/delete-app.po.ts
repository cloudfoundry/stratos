import { Page } from '../../po/page.po';
import { StepperComponent } from '../../po/stepper.po';
import { TableComponent } from '../../po/table.po';

export class DeleteApplication extends Page {

  public stepper = new StepperComponent();

  public table = new TableComponent();

  constructor(cfGuid: string, appGuid?: string, private appName?: string) {
    super(`/applications/${cfGuid}/${appGuid}/delete`);
  }

  public hasRouteStep() {
    return this.stepper.hasStep('Routes');
  }

}
