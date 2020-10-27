import { by, element, ElementFinder } from 'protractor';

import { ActionMonitorComponent } from '../po/action-monitor.po';
import { CheckboxComponent } from '../po/checkbox.po';
import { Component } from '../po/component.po';
import { FormComponent } from '../po/form.po';
import { ListComponent } from '../po/list.po';
import { Page } from '../po/page.po';
import { RadioGroup } from '../po/radio-group.po';
import { StackedInputActionsPo } from '../po/stacked-input-actions.po';
import { StepperComponent } from '../po/stepper.po';

export class ManageUsersSelectStep extends Component {
  constructor() {
    super(element(by.css('app-manage-users-select')));
  }
  selectUsersList = new ListComponent(this.locator);
}

export class ManageUsersSetUsernames extends Component {
  constructor() {
    super(element(by.css('app-manage-users-set-usernames')));
  }
  addRemoveRadio = new RadioGroup(this.getComponent());
  usernames = new StackedInputActionsPo(this.getComponent().element(by.css('app-stacked-input-actions')));
  originForm = new FormComponent(this.locator.element(by.css('.usernames__origin')));

}

export class ManageUsersModifyRolesStep extends Component {
  constructor() {
    super(element(by.css('app-manage-users-modify')));
  }
  orgsList = new ListComponent(this.locator.element(by.css('.modify-users__org-roles')));
  spacesList = new ListComponent(this.locator.element(by.css('.modify-users__spaces-roles')));

  setOrg(orgName: string) {
    expect(this.orgsList.isDisplayed()).toBeTruthy();
    const orgForm = new FormComponent(this.orgsList.table.getCell(0, 0));
    orgForm.fill({ selectorgguid: orgName });
  }

  getOrgManagerCheckbox(): CheckboxComponent {
    return new CheckboxComponent(this.orgsList.table.getCell(0, 1).element(by.css('mat-checkbox')));
  }

  getOrgAuditorCheckbox(): CheckboxComponent {
    return new CheckboxComponent(this.orgsList.table.getCell(0, 2).element(by.css('mat-checkbox')));
  }

  getOrgBillingManagerCheckbox(): CheckboxComponent {
    return new CheckboxComponent(this.orgsList.table.getCell(0, 3).element(by.css('mat-checkbox')));
  }

  getOrgUserCheckbox(): CheckboxComponent {
    return new CheckboxComponent(this.orgsList.table.getCell(0, 4).element(by.css('mat-checkbox')));
  }

  getSpaceManagerCheckbox(row: number): CheckboxComponent {
    return new CheckboxComponent(this.spacesList.table.getCell(row, 1).element(by.css('mat-checkbox')));
  }

  getSpaceAuditorCheckbox(row: number): CheckboxComponent {
    return new CheckboxComponent(this.spacesList.table.getCell(row, 2).element(by.css('mat-checkbox')));
  }

  getSpaceDeveloperCheckbox(row: number): CheckboxComponent {
    return new CheckboxComponent(this.spacesList.table.getCell(row, 3).element(by.css('mat-checkbox')));
  }
}

export class ManageUsersConfirmStep extends Component {
  actionTable: ActionMonitorComponent;

  constructor() {
    super(element(by.css('app-manage-users-confirm')));

    this.actionTable = new ActionMonitorComponent(this.locator);
  }
}

export class ManagerUsersPage extends Page {

  private locator: ElementFinder;
  stepper: StepperComponent;
  setUsernames = new ManageUsersSetUsernames();
  selectUsersStep = new ManageUsersSelectStep();
  modifyUsersStep = new ManageUsersModifyRolesStep();
  confirmStep = new ManageUsersConfirmStep();

  static determineUrl(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string): string {
    let url = `/cloud-foundry/${cfGuid}`;
    if (orgGuid) {
      url += `/organizations/${orgGuid}`;
    }
    if (spaceGuid) {
      url += `/spaces/${spaceGuid}`;
    }
    url += '/users/manage';
    if (userGuid) {
      url += `?user=${userGuid}`;
    }
    return url;
  }

  constructor(cfGuid: string, orgGuid?: string, spaceGuid?: string, userGuid?: string) {
    super(ManagerUsersPage.determineUrl(cfGuid, orgGuid, spaceGuid, userGuid));
    this.locator = element(by.css('app-manage-users'));
    this.stepper = new StepperComponent();
  }
}
