import { Page } from '../po/page.po';
import { ElementFinder, element, by } from 'protractor';
import { StepperComponent } from '../po/stepper.po';
import { ManageUsersConfirmStep } from './manage-users-page.po';

export class RemoveUsersPage extends Page {
  private locator: ElementFinder;
  stepper: StepperComponent;
  confirmStep = new ManageUsersConfirmStep();

  static determineUrl(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): string {
    let url = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      url += `/organizations/${orgGuid}`;
    }
    if (spaceGuid) {
      url += `/spaces/${spaceGuid}`;
    }
    url += '/users/remove';
    if (userGuid) {
      url += `?user=${userGuid}`;
    }
    return url;
  }

  constructor(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string) {
    super(RemoveUsersPage.determineUrl(cfGuid, orgGuid, spaceGuid, userGuid));
    this.locator = element(by.css('app-remove-users'));
    this.stepper = new StepperComponent();
  }
}
