import { browser, by, element, promise } from 'protractor';

import { CfUser } from '../../frontend/packages/cloud-foundry/src/store/types/cf-user.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { UaaHelpers } from '../helpers/uaa-helpers';
import { CFUsersListComponent } from '../po/cf-users-list.po';
import { RadioGroup } from '../po/radio-group.po';
import { StepperComponent } from '../po/stepper.po';
import { ManagerUsersPage } from './manage-users-page.po';
import { CfOrgLevelPage } from './org-level/cf-org-level-page.po';
import { CfSpaceLevelPage } from './space-level/cf-space-level-page.po';
import { setUpTestOrgSpaceE2eTest } from './users-list-e2e.helper';


const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-manage-by-username';

describe('CF - Manage roles by username - ', () => {

  // Use the same helper to avoid fetching the token multiple times
  const uaaHelpers = new UaaHelpers();

  const uniqueName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const orgName = uniqueName;
  const spaceName = uniqueName;
  const userName = uniqueName;

  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let spaceGuid: string;
  let userGuid: string;
  let uaaUserGuid: string;

  const usersTable = new CFUsersListComponent();
  let manageUsersStepper: ManagerUsersPage;


  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .loginAs(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);

    cfHelper = new CFHelpers(e2eSetup);
    return uaaHelpers.setup()
      .then(() => e2e.log(`Creating User: ${userName}`))
      .then(() => uaaHelpers.createUser(userName))
      .then(newUser => {
        uaaUserGuid = newUser.id;
        e2e.log(`Created UAA User: ${newUser.userName}. Guid: ${uaaUserGuid}`);
        const defaultCf = e2e.secrets.getDefaultCFEndpoint();
        cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      })
      .then(() => cfHelper.createUser(cfGuid, uaaUserGuid))
      .then(cfUser => {
        expect(cfUser).toBeTruthy();
        expect(cfUser.entity.username).toBeTruthy();
        expect(cfUser.metadata.guid).toBeTruthy();

        e2e.log(`Created Cf User: ${cfUser.entity.username}. Guid: ${cfUser.metadata.guid}`);
        userGuid = cfUser.metadata.guid;
        return setUpTestOrgSpaceE2eTest(orgName, spaceName, userName, false, e2eSetup);
      })
      .then(res => {
        cfGuid = res.cfGuid;
        orgGuid = res.orgGuid;
        spaceGuid = res.spaceGuid;
      })
      // Ensure that cf responds with the user we've just created, otherwise it won't appear in the ui
      .then(() => cfHelper.cfRequestHelper.chain<APIResource<CfUser>>(
        null,
        () => cfHelper.fetchUser(cfGuid, userName),
        10,
        (user: APIResource<CfUser>) => !!user,
        0
      ))
      .then(cfUser => {
        expect(cfUser).toBeTruthy();
        expect(cfUser.entity.username).toBeTruthy();
        expect(cfUser.metadata.guid).toBe(userGuid);
      })
      // .then(() => {
      //   removeUsersPage = new RemoveUsersPage(cfGuid, orgGuid, spaceGuid, userGuid);
      //   return protractor.promise.controlFlow().execute(() => {
      //     return navToUserTableFn(cfGuid, orgGuid, spaceGuid);
      //   });
      // })
      .then(() => e2e.log(`Set up env correctly`));
  }, 75000);

  describe('Org Level -', () => {
    let userRowIndex = 0;

    let orgPage: CfOrgLevelPage;
    let stepper: StepperComponent;

    function checkOrgChip(userIndex: number, roleName: string, shouldBeVisible = true) {
      const chip = usersTable.getPermissionChip(userIndex, null, null, true, roleName);
      if (shouldBeVisible) {
        expect(chip.isDisplayed()).toBeTruthy();
      } else {
        expect(chip.isDisplayed()).toBeFalsy();
      }
    }

    function checkSpaceChip(userIndex: number, roleName: string, shouldBeVisible = true) {
      const chip = usersTable.getPermissionChip(userIndex, null, spaceName, false, roleName);
      if (shouldBeVisible) {
        expect(chip.isDisplayed()).toBeTruthy();
      } else {
        expect(chip.isDisplayed()).toBeFalsy();
      }
    }

    beforeAll(() => {
      orgPage = CfOrgLevelPage.forEndpoint(cfGuid, orgGuid);
      manageUsersStepper = new ManagerUsersPage(cfGuid, orgGuid, null, userGuid);
      stepper = manageUsersStepper.stepper;

      orgPage.navigateTo();
      orgPage.waitForPageOrChildPage();
      orgPage.loadingIndicator.waitUntilNotShown();
      orgPage.goToUsersTab();

      usersTable.waitUntilShown();
      usersTable.waitForNoLoadingIndicator(20000);
      usersTable.header.waitUntilShown('User table header');
      usersTable.header.setSearchText(userName);

      return usersTable.table.findRow('username', userName).then(row => {
        // userRowIndex = row; // Should always be 0
        expect(usersTable.table.getCell(userRowIndex, 1).getText()).toBe(userName);

        usersTable.expandOrgsChips(userRowIndex);
        return usersTable.expandSpaceChips(userRowIndex);
      });

    });

    function setupOrgLevelTest(selectAddRemove: (rb: RadioGroup) => void, checkInitialState: () => void, checkFinishingState: () => void) {
      it('Check initial state and get to stepper', () => {
        checkInitialState();

        orgPage.subHeader.hasIconButton('people');
        orgPage.subHeader.clickIconButton('people');

        stepper.waitUntilShown();
      });

      it('Usernames Step', () => {
        stepper.waitForStep('Usernames');

        const usernamesStep = manageUsersStepper.setUsernames;
        const addRemove = usernamesStep.addRemoveRadio;
        const usernames = usernamesStep.usernames;
        const origin = usernamesStep.originForm;

        // Initial State
        expect(stepper.canNext()).toBeFalsy();
        expect(addRemove.getSelected().getText()).toBe('Add Roles');
        expect(usernames.getInputCount()).toBe(1);
        expect(usernames.addInput());
        expect(usernames.getInputCount()).toBe(2);
        expect(usernames.removeInput(1));
        expect(usernames.getInputCount()).toBe(1);
        expect(usernames.getInputValue(0)).toBe('');
        expect(origin.getText('origin')).toBe('');

        // Set State
        selectAddRemove(addRemove);
        usernames.setInput({
          [0]: userName
        });
        stepper.waitUntilCanNext('Next');
        stepper.next();
      });

      it('Set roles Step', () => {
        stepper.waitForStep('Select Roles');

        // Initial State
        expect(stepper.canNext()).toBeFalsy();
        const modifyStep = manageUsersStepper.modifyUsersStep;
        expect(modifyStep.getOrgUserCheckbox().isChecked()).toBeFalsy();
        expect(modifyStep.getOrgAuditorCheckbox().isChecked()).toBeFalsy();
        expect(modifyStep.getOrgBillingManagerCheckbox().isChecked()).toBeFalsy();
        expect(modifyStep.getOrgManagerCheckbox().isChecked()).toBeFalsy();
        expect(modifyStep.getSpaceAuditorCheckbox(0).isChecked()).toBeFalsy();
        expect(modifyStep.getSpaceDeveloperCheckbox(0).isChecked()).toBeFalsy();
        expect(modifyStep.getSpaceManagerCheckbox(0).isChecked()).toBeFalsy();

        // Set State
        modifyStep.getOrgUserCheckbox().getComponent().click();
        modifyStep.getOrgAuditorCheckbox().getComponent().click();
        modifyStep.getOrgBillingManagerCheckbox().getComponent().click();
        modifyStep.getOrgManagerCheckbox().getComponent().click();
        modifyStep.getSpaceAuditorCheckbox(0).getComponent().click();
        modifyStep.getSpaceDeveloperCheckbox(0).getComponent().click();
        modifyStep.getSpaceManagerCheckbox(0).getComponent().click();

        expect(modifyStep.getOrgUserCheckbox().isChecked()).toBeTruthy();
        expect(modifyStep.getOrgAuditorCheckbox().isChecked()).toBeTruthy();
        expect(modifyStep.getOrgBillingManagerCheckbox().isChecked()).toBeTruthy();
        expect(modifyStep.getOrgManagerCheckbox().isChecked()).toBeTruthy();
        expect(modifyStep.getSpaceAuditorCheckbox(0).isChecked()).toBeTruthy();
        expect(modifyStep.getSpaceDeveloperCheckbox(0).isChecked()).toBeTruthy();
        expect(modifyStep.getSpaceManagerCheckbox(0).isChecked()).toBeTruthy();

        stepper.waitUntilCanNext('Next');
        stepper.next();

      });

      it('Confirm & Change Roles Steps', () => {
        stepper.waitForStep('Confirm');

        // Execute change
        stepper.waitUntilCanNext('Apply');
        stepper.next();

        // Wait until all of the spinners have gone
        const spinners = element.all(by.tagName('mat-progress-spinner'));
        browser.wait(() => spinners.isPresent().then(present => !present));

        stepper.next();
        stepper.waitUntilNotShown();
      });

      it('Confirm change in users table', () => {
        usersTable.waitUntilShown();
        usersTable.waitForNoLoadingIndicator(20000);
        usersTable.header.waitUntilShown('User table header');
        usersTable.header.setSearchText(userName);

        checkFinishingState();
      });
    }

    describe('Remove - ', () => {

      const selectAddRemove = (rb: RadioGroup) => {
        rb.select(1);
        expect(rb.getSelected().getText()).toBe('Remove Roles');
      };
      const checkInitialState = () => {
        checkOrgChip(userRowIndex, 'User');
        checkOrgChip(userRowIndex, 'Billing Manager');
        checkOrgChip(userRowIndex, 'Auditor');
        checkOrgChip(userRowIndex, 'Manager');
        checkSpaceChip(userRowIndex, 'Developer');
        checkSpaceChip(userRowIndex, 'Auditor');
        checkSpaceChip(userRowIndex, 'Manager');

      };
      const checkFinishingState = () => {
        expect(usersTable.table.findRow('username', userName, false)).toBe(-1);

        usersTable.header.getMultiFilterForm().fill({
          showusers: 'Users Without Roles'
        });

        return usersTable.table.findRow('username', userName).then(row => {
          userRowIndex = row;
          expect(usersTable.table.getCell(userRowIndex, 1).getText()).toBe(userName);
          expect(usersTable.table.getCell(userRowIndex, 2).getText()).toBe('None');
          expect(usersTable.table.getCell(userRowIndex, 3).getText()).toBe('None');
        });
      };

      setupOrgLevelTest(selectAddRemove, checkInitialState, checkFinishingState);
    });

    describe('Add - ', () => {
      const selectAddRemove = (rb: RadioGroup) => {
        rb.select(0);
        expect(rb.getSelected().getText()).toBe('Add Roles');
      };
      const checkInitialState = () => {
        return usersTable.table.findRow('username', userName).then(row => {
          expect(usersTable.table.getCell(row, 1).getText()).toBe(userName);
          expect(usersTable.table.getCell(row, 2).getText()).toBe('None');
          expect(usersTable.table.getCell(row, 3).getText()).toBe('None');
        });
      };
      const checkFinishingState = () => {
        usersTable.header.getMultiFilterForm().fill({
          showusers: 'Users With Roles'
        });

        return usersTable.table.findRow('username', userName).then(row => {
          usersTable.expandOrgsChips(userRowIndex);
          usersTable.expandSpaceChips(userRowIndex);

          checkOrgChip(userRowIndex, 'User');
          checkOrgChip(userRowIndex, 'Billing Manager');
          checkOrgChip(userRowIndex, 'Auditor');
          checkOrgChip(userRowIndex, 'Manager');
          checkSpaceChip(userRowIndex, 'Developer');
          checkSpaceChip(userRowIndex, 'Auditor');
          checkSpaceChip(userRowIndex, 'Manager');
        });

      };

      setupOrgLevelTest(selectAddRemove, checkInitialState, checkFinishingState);
    });
  });

  describe('Space Level -', () => {
    let userRowIndex = 0;

    let spacePage: CfSpaceLevelPage;
    let stepper: StepperComponent;

    function checkChip(userIndex: number, roleName: string, shouldBeVisible = true) {
      const chip = usersTable.getPermissionChip(userIndex, null, null, true, roleName);
      if (shouldBeVisible) {
        expect(chip.isDisplayed()).toBeTruthy();
      } else {
        expect(chip.isDisplayed()).toBeFalsy();
      }
    }

    function checkSpaceChip(userIndex: number, roleName: string, shouldBeVisible = true) {
      const chip = usersTable.getPermissionChip(userIndex, null, null, false, roleName);
      if (shouldBeVisible) {
        expect(chip.isDisplayed()).toBeTruthy();
      } else {
        expect(chip.isDisplayed()).toBeFalsy();
      }
    }

    beforeAll(() => {
      spacePage = CfSpaceLevelPage.forEndpoint(cfGuid, orgGuid, spaceGuid);
      manageUsersStepper = new ManagerUsersPage(cfGuid, orgGuid, spaceGuid, userGuid);
      stepper = manageUsersStepper.stepper;

      spacePage.navigateTo();
      spacePage.waitForPageOrChildPage();
      spacePage.loadingIndicator.waitUntilNotShown();
      spacePage.goToUsersTab();

      usersTable.waitUntilShown();
      usersTable.waitForNoLoadingIndicator(20000);
      usersTable.header.waitUntilShown('User table header');
      usersTable.header.setSearchText(userName);

      return usersTable.table.findRow('username', userName).then(row => {
        // userRowIndex = row; // Should always be 0
        expect(usersTable.table.getCell(row, 1).getText()).toBe(userName);

        usersTable.expandOrgsChips(row);
        return usersTable.expandSpaceChips(row);
      });

    });

    function setupSpaceLevelTest(
      selectAddRemove: (rb: RadioGroup) => void,
      checkInitialState: () => void,
      checkFinishingState: () => void) {
      it('Check initial state and get to stepper', () => {
        checkInitialState();

        spacePage.subHeader.hasIconButton('people');
        spacePage.subHeader.clickIconButton('people');

        stepper.waitUntilShown();
      });

      it('Usernames Step', () => {
        stepper.waitForStep('Usernames');

        const usernamesStep = manageUsersStepper.setUsernames;
        const addRemove = usernamesStep.addRemoveRadio;
        const usernames = usernamesStep.usernames;
        const origin = usernamesStep.originForm;

        // Initial State
        expect(stepper.canNext()).toBeFalsy();
        expect(addRemove.getSelected().getText()).toBe('Add Roles');
        expect(usernames.getInputCount()).toBe(1);
        expect(usernames.addInput());
        expect(usernames.getInputCount()).toBe(2);
        expect(usernames.removeInput(1));
        expect(usernames.getInputCount()).toBe(1);
        expect(usernames.getInputValue(0)).toBe('');
        expect(origin.getText('origin')).toBe('');

        // Set State
        selectAddRemove(addRemove);
        usernames.setInput({
          [0]: userName
        });
        stepper.waitUntilCanNext('Next');
        stepper.next();
      });

      it('Set roles Step', () => {
        stepper.waitForStep('Select Roles');

        // Initial State
        expect(stepper.canNext()).toBeFalsy();
        const modifyStep = manageUsersStepper.modifyUsersStep;
        expect(modifyStep.getSpaceAuditorCheckbox(0).isChecked()).toBeFalsy();
        expect(modifyStep.getSpaceDeveloperCheckbox(0).isChecked()).toBeFalsy();
        expect(modifyStep.getSpaceManagerCheckbox(0).isChecked()).toBeFalsy();

        // Set State
        modifyStep.getSpaceAuditorCheckbox(0).getComponent().click();
        modifyStep.getSpaceDeveloperCheckbox(0).getComponent().click();
        modifyStep.getSpaceManagerCheckbox(0).getComponent().click();

        expect(modifyStep.getSpaceAuditorCheckbox(0).isChecked()).toBeTruthy();
        expect(modifyStep.getSpaceDeveloperCheckbox(0).isChecked()).toBeTruthy();
        expect(modifyStep.getSpaceManagerCheckbox(0).isChecked()).toBeTruthy();

        stepper.waitUntilCanNext('Next');
        stepper.next();

      });

      it('Confirm & Change Roles Steps', () => {
        stepper.waitForStep('Confirm');

        // Execute change
        stepper.waitUntilCanNext('Apply');
        stepper.next();

        // Wait until all of the spinners have gone
        const spinners = element.all(by.tagName('mat-progress-spinner'));
        browser.wait(() => spinners.isPresent().then(present => !present));

        stepper.next();
        stepper.waitUntilNotShown();
      });

      it('Confirm change in users table', () => {
        usersTable.waitUntilShown();
        usersTable.waitForNoLoadingIndicator(20000);
        usersTable.header.waitUntilShown('User table header');
        usersTable.header.setSearchText(userName);

        checkFinishingState();
      });
    }

    describe('Remove - ', () => {

      const selectAddRemove = (rb: RadioGroup) => {
        rb.select(1);
        expect(rb.getSelected().getText()).toBe('Remove Roles');
      };
      const checkInitialState = () => {
        checkChip(userRowIndex, 'User');
        checkSpaceChip(userRowIndex, 'Developer');
        checkSpaceChip(userRowIndex, 'Auditor');
        checkSpaceChip(userRowIndex, 'Manager');

      };
      const checkFinishingState = () => {
        expect(usersTable.table.findRow('username', userName, false)).toBe(-1);

        usersTable.header.getMultiFilterForm().fill({
          showusers: 'Users Without Roles'
        });

        return usersTable.table.findRow('username', userName).then(row => {
          userRowIndex = row;
          expect(usersTable.table.getCell(userRowIndex, 1).getText()).toBe(userName);
          expect(usersTable.table.getCell(userRowIndex, 3).getText()).toBe('None');
        });
      };

      setupSpaceLevelTest(selectAddRemove, checkInitialState, checkFinishingState);
    });

    describe('Add - ', () => {
      const selectAddRemove = (rb: RadioGroup) => {
        rb.select(0);
        expect(rb.getSelected().getText()).toBe('Add Roles');
      };
      const checkInitialState = () => {
        return usersTable.table.findRow('username', userName).then(row => {
          expect(usersTable.table.getCell(row, 1).getText()).toBe(userName);
          expect(usersTable.table.getCell(row, 3).getText()).toBe('None');
        });
      };
      const checkFinishingState = () => {
        usersTable.header.getMultiFilterForm().fill({
          showusers: 'Users With Roles'
        });

        return usersTable.table.findRow('username', userName).then(row => {
          usersTable.expandOrgsChips(userRowIndex);
          usersTable.expandSpaceChips(userRowIndex);

          checkChip(userRowIndex, 'User');
          checkSpaceChip(userRowIndex, 'Developer');
          checkSpaceChip(userRowIndex, 'Auditor');
          checkSpaceChip(userRowIndex, 'Manager');
        });

      };

      setupSpaceLevelTest(selectAddRemove, checkInitialState, checkFinishingState);
    });
  });

  afterAll(() => {
    const deleteUser = uaaUserGuid ? cfHelper.deleteUser(cfGuid, userGuid, userName, uaaUserGuid) : promise.fullyResolved(true);
    return promise.all([
      deleteUser.then(() => e2e.log(`Deleted Cf user ${userGuid} & UAA user ${uaaUserGuid}`)),
      cfHelper.deleteOrgIfExisting(cfGuid, orgName).then(() => e2e.log(`Deleted Org: ${orgName}`))
    ]);
  });

});
