import { ListComponent } from '../../po/list.po';
import { Page } from '../../po/page.po';
import { StepperComponent } from '../../po/stepper.po';
import { TableComponent } from '../../po/table.po';

export class DeployApplication extends Page {

  public stepper = new StepperComponent();

  public table = new TableComponent();

  constructor() {
    super(`/applications/deploy`);
  }

  public hasRouteStep() {
    return this.stepper.hasStep('Routes');
  }

  public getCommitList() {
    return new ListComponent().table;
  }

}
