import { browser, by, element, promise, protractor } from 'protractor';

import { FormComponent } from '../../po/form.po';
import { ListComponent } from '../../po/list.po';
import { Page } from '../../po/page.po';
import { StepperComponent } from '../../po/stepper.po';
import { TableComponent } from '../../po/table.po';

const until = protractor.ExpectedConditions;

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

  public getOverridesForm(): FormComponent {
    return new FormComponent(element(by.css('app-deploy-application-options-step form')));
  }

  public waitUntilDeployed(timeout = 120000) {
    const deployStatus = element(by.cssContainingText('.deploy-app__title', 'Deployed'));
    return browser.wait(until.presenceOf(deployStatus), timeout);
  }

  public sourceStepGetRedeployCommit(): promise.Promise<string> {
    return element(by.css('.deploy-step2-form__commit a')).getText();
  }
}
