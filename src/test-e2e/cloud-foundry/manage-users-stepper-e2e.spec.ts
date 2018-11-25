import { browser, by, element, protractor } from 'protractor';

import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CFUsersListComponent } from '../po/cf-users-list.po';
import { CheckboxComponent } from '../po/checkbox.po';
import { CfTopLevelPage } from './cf-level/cf-top-level-page.po';
import { ManagerUsersPage } from './manage-users-page.po';
import { setUpTestOrgSpaceE2eTest } from './users-list-e2e.helper';

describe('Manage Users Stepper', () => {

  const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-manage-users';

  const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const spaceName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const userName = e2e.secrets.getDefaultCFEndpoint().creds.nonAdmin.username;

  let manageUsersPage: ManagerUsersPage, cfHelper: CFHelpers, cfGuid, userGuid;

  beforeAll(() => {
    setUpTestOrgSpaceE2eTest(orgName, spaceName, userName, true).then(res => {
      cfHelper = res.cfHelper;
      cfGuid = res.cfGuid;
      return cfHelper.fetchUser(cfGuid, userName).then(user => {
        expect(user).toBeTruthy();
        userGuid = user.metadata.guid;
      });
    });

    protractor.promise.controlFlow().execute(() => {
      manageUsersPage = new ManagerUsersPage(cfGuid);
      manageUsersPage.navigateTo();
      return manageUsersPage.waitForPage();
    });
  });

  const timeout = 100000;
  extendE2ETestTime(timeout);

  it('Check flow + add/remove roles ', () => {
    const stpr = manageUsersPage.stepper;

    // Select Users Step
    const selectUsersList = manageUsersPage.selectUsersStep.selectUsersList;
    expect(stpr.getActiveStepName()).toBe('Select Users');
    selectUsersList.header.setSearchText(userName);
    expect(selectUsersList.getTotalResults()).toBe(1);
    expect(stpr.canPrevious()).toBeFalsy();
    expect(stpr.canCancel()).toBeTruthy();
    expect(stpr.canNext()).toBeFalsy();

    selectUsersList.table.selectRow(0, false);
    expect(stpr.canNext()).toBeTruthy();
    stpr.next();

    // Select Roles Step
    const modifyStep = manageUsersPage.modifyUsersStep;
    const orgsList = modifyStep.orgsList;
    const spacesList = modifyStep.spacesList;
    expect(stpr.getActiveStepName()).toBe('Select Roles');
    orgsList.waitUntilShown();
    modifyStep.setOrg(orgName);
    // ... check button state
    expect(stpr.canPrevious()).toBeTruthy();
    expect(stpr.canCancel()).toBeTruthy();
    expect(stpr.canNext()).toBeFalsy();

    // ... check org state
    const orgManagerCheckbox = modifyStep.getOrgManagerCheckbox();
    const orgAuditorCheckbox = modifyStep.getOrgAuditorCheckbox();
    const orgBillingManagerCheckbox = modifyStep.getOrgBillingManagerCheckbox();
    const orgUserCheckbox = modifyStep.getOrgUserCheckbox();

    expect(orgManagerCheckbox.isDisabled()).toBeFalsy();
    expect(orgManagerCheckbox.isChecked()).toBeTruthy();
    expect(orgAuditorCheckbox.isDisabled()).toBeFalsy();
    expect(orgAuditorCheckbox.isChecked()).toBeTruthy();
    expect(orgBillingManagerCheckbox.isDisabled()).toBeFalsy();
    expect(orgBillingManagerCheckbox.isChecked()).toBeFalsy();
    expect(orgUserCheckbox.isDisabled()).toBeTruthy();
    expect(orgUserCheckbox.isChecked()).toBeTruthy();

    // ... check space state
    expect(spacesList.getTotalResults()).toBe(1);
    expect(spacesList.table.getCell(0, 0).getText()).toBe(spaceName);
    const spaceManagerCheckbox = modifyStep.getSpaceManagerCheckbox(0);
    const spaceAuditorCheckbox = modifyStep.getSpaceAuditorCheckbox(0);
    const spaceDeveloperCheckbox = modifyStep.getSpaceDeveloperCheckbox(0);
    expect(spaceManagerCheckbox.isDisabled()).toBeFalsy();
    expect(spaceManagerCheckbox.isChecked()).toBeTruthy();
    expect(spaceAuditorCheckbox.isDisabled()).toBeFalsy();
    expect(spaceAuditorCheckbox.isChecked()).toBeTruthy();
    expect(spaceDeveloperCheckbox.isDisabled()).toBeFalsy();
    expect(spaceDeveloperCheckbox.isChecked()).toBeTruthy();

    // ... check button state on toggle changes
    orgManagerCheckbox.getComponent().click();
    expect(stpr.canNext()).toBeTruthy();
    orgManagerCheckbox.getComponent().click();
    expect(stpr.canNext()).toBeFalsy();

    // ... remove all that are checked
    orgManagerCheckbox.getComponent().click();
    orgAuditorCheckbox.getComponent().click();
    spaceManagerCheckbox.getComponent().click();
    spaceAuditorCheckbox.getComponent().click();
    spaceDeveloperCheckbox.getComponent().click();
    expect(orgUserCheckbox.isDisabled()).toBeFalsy();
    orgUserCheckbox.getComponent().click();

    expect(orgManagerCheckbox.isChecked()).toBeFalsy();
    expect(orgAuditorCheckbox.isChecked()).toBeFalsy();
    expect(orgBillingManagerCheckbox.isChecked()).toBeFalsy();
    expect(orgUserCheckbox.isChecked()).toBeFalsy();
    expect(spaceManagerCheckbox.isChecked()).toBeFalsy();
    expect(spaceAuditorCheckbox.isChecked()).toBeFalsy();
    expect(spaceDeveloperCheckbox.isChecked()).toBeFalsy();

    // ... check billing manager (should also check org user)
    orgBillingManagerCheckbox.getComponent().click();

    expect(orgManagerCheckbox.isChecked()).toBeFalsy();
    expect(orgAuditorCheckbox.isChecked()).toBeFalsy();
    expect(orgBillingManagerCheckbox.isChecked()).toBeTruthy();
    expect(orgUserCheckbox.isChecked()).toBeTruthy();
    expect(spaceManagerCheckbox.isChecked()).toBeFalsy();
    expect(spaceAuditorCheckbox.isChecked()).toBeFalsy();
    expect(spaceDeveloperCheckbox.isChecked()).toBeFalsy();


    expect(stpr.canNext()).toBeTruthy();
    stpr.next();

    // Confirm Step
    expect(stpr.getActiveStepName()).toBe('Confirm');
    const confirmStep = manageUsersPage.confirmStep;

    const orgTarget = `Org: ${orgName}`;
    const spaceTarget = `Space: ${spaceName}`;

    // ... initial action table state
    expect(confirmStep.actionTable.table.getTableData()).toEqual(createActionTableDate(orgTarget, spaceTarget, ''));
    expect(stpr.canPrevious()).toBeTruthy();
    expect(stpr.canCancel()).toBeTruthy();
    expect(stpr.canNext()).toBeTruthy();

    stpr.next();
    expect(stpr.getActiveStepName()).toBe('Confirm');

    // Wait until all of the spinners have gone
    const spinners = element.all(by.tagName('mat-progress-spinner'));
    browser.wait(function () {
      return spinners.isPresent().then(function (present) {
        return !present;
      });
    });

    // ... action table state after submit
    expect(confirmStep.actionTable.table.getTableData()).toEqual(createActionTableDate(orgTarget, spaceTarget, 'done'));
    expect(stpr.canPrevious()).toBeFalsy();
    expect(stpr.canCancel()).toBeFalsy();
    expect(stpr.canNext()).toBeTruthy();

    stpr.next();
    stpr.waitUntilNotShown();

  }, timeout);

  it('Open stepper with preselected user', () => {
    const cfPage = CfTopLevelPage.forEndpoint(cfGuid);
    cfPage.navigateTo();
    cfPage.goToUsersTab();

    const usersTable = new CFUsersListComponent();
    usersTable.header.setSearchText(userName);
    expect(usersTable.getTotalResults()).toBe(1);

    const selectUser = new CheckboxComponent(usersTable.table.getCell(0, 0));
    selectUser.getComponent().click();
    const usersButton = usersTable.header.getIconButton('people');
    expect(usersButton.isDisplayed()).toBeTruthy();
    usersButton.click();

    manageUsersPage = new ManagerUsersPage(cfGuid, null, null, userGuid);
    manageUsersPage.waitForPage();
    expect(manageUsersPage.stepper.getActiveStepName()).toBe('Select Roles');
  });

  function createActionTableDate(orgTarget, spaceTarget, stateIcon) {
    return [{
      user: userName,
      action: 'remove_circle\nRemove',
      role: 'Manager',
      target: orgTarget,
      'column-4': stateIcon
    },
    {
      user: userName,
      action: 'add_circle\nAdd',
      role: 'Billing Manager',
      target: orgTarget,
      'column-4': stateIcon
    },
    {
      user: userName,
      action: 'remove_circle\nRemove',
      role: 'Auditor',
      target: orgTarget,
      'column-4': stateIcon
    },
    {
      user: userName,
      action: 'remove_circle\nRemove',
      role: 'Manager',
      target: spaceTarget,
      'column-4': stateIcon
    },
    {
      user: userName,
      action: 'remove_circle\nRemove',
      role: 'Developer',
      target: spaceTarget,
      'column-4': stateIcon
    },
    {
      user: userName,
      action: 'remove_circle\nRemove',
      role: 'Auditor',
      target: spaceTarget,
      'column-4': stateIcon
    }];
  }

  afterAll(() => {
    return cfHelper.deleteOrgIfExisting(cfGuid, orgName);
  });
});
