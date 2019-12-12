import * as moment from 'moment-timezone';
import { by, ElementArrayFinder, ElementFinder, promise } from 'protractor';

import { FormComponent } from '../../po/form.po';
import { StepperComponent } from '../../po/stepper.po';

export class CreateAutoscalerPolicyStep extends StepperComponent {

  getStepperForm = (): FormComponent => new FormComponent(this.locator.element(by.tagName('form')));

  private getAddButton(): ElementFinder {
    return this.locator.element(by.id('autoscaler-policy-edit-add'));
  }

  clickAddButton() {
    this.getAddButton().click();
  }

  private getEditButton(): ElementFinder {
    return this.locator.element(by.id('autoscaler-policy-edit-edit'));
  }

  clickEditButton() {
    this.getEditButton().click();
  }

  private getDoneButton(): ElementFinder {
    return this.locator.element(by.id('autoscaler-policy-edit-done'));
  }

  clickDoneButton() {
    this.getDoneButton().click();
  }

  getDoneButtonDisabledStatus(): promise.Promise<string> {
    return this.getDoneButton().getAttribute('disabled');
  }

  private getDeleteButton(index): ElementFinder {
    return this.locator.all(by.id('autoscaler-policy-edit-delete')).get(index);
  }

  clickDeleteButton(index) {
    this.getDeleteButton(index).click();
  }

  private getRuleTiles(): ElementArrayFinder {
    return this.locator.element(by.tagName('app-tile-grid')).all(by.tagName('app-tile-group'));
  }

  getRuleTilesCount(): promise.Promise<any> {
    return this.getRuleTiles().count();
  }

  private getMatErrors(): ElementArrayFinder {
    return this.locator.all(by.tagName('mat-error'));
  }

  getMatErrorsCount(): promise.Promise<any> {
    return this.getMatErrors().count();
  }

  getScheduleStartTime(): promise.Promise<moment.Moment> {
    return this.getStepperForm().getText('start_date_time').then(startTime => {
      return moment(startTime);
    });
  }

}
