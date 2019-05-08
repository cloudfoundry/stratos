import { browser, promise } from 'protractor';

import { e2e } from '../e2e';
import { E2EConfigCloudFoundry } from '../e2e.types';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { CFPage } from '../po/cf-page.po';
import { CFUsersListComponent } from '../po/cf-users-list.po';
import { InviteUserStepperPo } from '../po/invite-users-stepper.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { StackedInputActionsPo } from '../po/stacked-input-actions.po';
import { CfTopLevelPage } from './cf-level/cf-top-level-page.po';
import { ConfigInviteClientDialog } from './cf-level/config-invite-client-dialog.po';


export function setupInviteUserTests(
  isSpace: boolean,
  navToOrgSpaceUsersList: (cfHelper: CFHelpers, defaultCf: E2EConfigCloudFoundry) => promise.Promise<any>,
  navToCfSummary: () => promise.Promise<any>
) {
  let defaultCf: E2EConfigCloudFoundry = e2e.secrets.getDefaultCFEndpoint();
  let cfHelper: CFHelpers;

  beforeAll(() => {
    defaultCf = e2e.secrets.getDefaultCFEndpoint();
    const setup = e2e.setup(ConsoleUserType.admin)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.admin)
      .connectAllEndpoints(ConsoleUserType.user);
    const page = new CFPage();
    page.sideNav.goto(SideNavMenuItem.CloudFoundry);
    cfHelper = new CFHelpers(setup);
    return navToOrgSpaceUsersList(cfHelper, defaultCf);
  });

  const usersTable = new CFUsersListComponent();

  it('Not configured - No Button', () => {
    usersTable.waitUntilShown();
    usersTable.getInviteUserButtonComponent().waitUntilNotShown();
  });

  it('Configure Client', () => {
    navToCfSummary();
    return CfTopLevelPage.detect().then(cfPage => {
      cfPage.waitForPageOrChildPage();
      cfPage.goToSummaryTab();
      cfPage.isUserInviteConfigured().then(configured => {
        if (!configured) {
          cfPage.clickInviteConfigure();
          const dialog = new ConfigInviteClientDialog();
          dialog.form.fill({ clientid: defaultCf.invite.clientId, clientsecret: defaultCf.invite.clientSecret });
          dialog.configure();
          dialog.waitUntilNotShown();
        }
        return navToOrgSpaceUsersList(cfHelper, defaultCf);
      });
    });
  });

  describe('Stepper - ', () => {
    let inviteUserStepper: InviteUserStepperPo;
    let stackedActions: StackedInputActionsPo;
    const fieldOne = 0;
    const fieldTwo = 1;

    beforeAll(() => {
      usersTable.getInviteUserButtonComponent().waitUntilShown();
      usersTable.inviteUser();
      inviteUserStepper = new InviteUserStepperPo();
      stackedActions = inviteUserStepper.getStackedActions();
    });

    it('Initial state', () => {
      expect(inviteUserStepper.hasPrevious()).toBeFalsy();
      expect(inviteUserStepper.canCancel()).toBeTruthy();
      expect(inviteUserStepper.canNext()).toBeFalsy();

      expect(inviteUserStepper.getStepperForm().getFieldsCount()).toBe(1);
    });

    it('Add/Remove', () => {
      expect(stackedActions.getInputCount()).toBe(1);
      stackedActions.setInput({ [fieldOne]: '0' });
      stackedActions.addInput();
      expect(stackedActions.getInputCount()).toBe(2);
      stackedActions.setInput({ [fieldTwo]: '1' });
      stackedActions.removeInput(1);
      expect(stackedActions.getInputCount()).toBe(1);
      expect(stackedActions.getInputValue(fieldOne)).toBe('0');
      stackedActions.clearInput(fieldOne);
    });

    it('Validation', () => {
      const validEmail = 'a@b.com';
      const invalidEmail = 'i\'m not an email address';

      // Bad format
      stackedActions.setInput({ [fieldOne]: invalidEmail });
      // Set focus elsewhere so validation runs
      stackedActions.getComponent().click();
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeTruthy();
      expect(stackedActions.fieldInvalidMessage(fieldOne)).toBe('Please enter a valid email address');
      stackedActions.setInput({ [fieldOne]: validEmail });
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeFalsy();

      // Not unique
      stackedActions.addInput();
      stackedActions.setInput({ [fieldTwo]: validEmail });
      // Set focus elsewhere so validation runs
      stackedActions.getComponent().click();
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeTruthy();
      expect(stackedActions.isFieldInvalid(fieldTwo)).toBeTruthy();

      const newValidEmail = validEmail + 'change';
      stackedActions.setInput({ [fieldTwo]: newValidEmail });
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeFalsy();
      expect(stackedActions.isFieldInvalid(fieldTwo)).toBeFalsy();

      stackedActions.setInput({ [fieldOne]: newValidEmail });
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeTruthy();
      expect(stackedActions.isFieldInvalid(fieldTwo)).toBeTruthy();

      stackedActions.removeInput(1);
      expect(stackedActions.isFieldInvalid(fieldOne)).toBeFalsy();
      stackedActions.clearInput(fieldOne);
    });

    it('One bad email address', () => {
      const validEmail = 'a@b.com';
      const slightlyValidEmail = 'a@b'; // Exploit difference between angular email validation and uaa (passes locally, fails remotely)
      stackedActions.addInput();
      expect(stackedActions.getInputCount()).toBe(2);
      stackedActions.setInput({ [fieldOne]: validEmail, [fieldTwo]: slightlyValidEmail });
      expect(inviteUserStepper.canNext()).toBeTruthy();
      inviteUserStepper.next();
      inviteUserStepper.snackBar.waitForMessage('Failed to invite one or more users. Please address per user message and try again');
      expect(stackedActions.isInputSuccess(0)).toBe(true);
      expect(stackedActions.isInputSuccess(1)).toBe(false);
      expect(stackedActions.getInputMessage(1)).toBe(`${slightlyValidEmail} is invalid email.`);
      // Clear state
      inviteUserStepper.cancel();
      usersTable.inviteUser();
    });

    function testUser(userName: string, spaceRole: string) {
      usersTable.header.setSearchText(userName);
      expect(usersTable.table.getRowCount()).toBe(1);
      usersTable.getPermissions(0, true).getChips().then(chips => {
        expect(chips.length).toBe(1);
        chips[0].getText().then(text => {
          expect(text.startsWith('User')).toBeTruthy();
        });
      });
      if (isSpace) {
        usersTable.getPermissions(0, false).getChips().then(chips => {
          expect(chips.length).toBe(1);
          chips[0].getText().then(text => {
            expect(text.startsWith('Manager')).toBeTruthy();
          });
        });
      } else {
        usersTable.getPermissions(0, false).waitUntilNotShown();
      }
    }

    it('Invite two users', () => {
      stackedActions.addInput();
      expect(stackedActions.getInputCount()).toBe(2);

      const user1 = InviteUserStepperPo.createUserEmail(null, 'Invite1');
      const user2 = InviteUserStepperPo.createUserEmail(null, 'Invite2');
      stackedActions.setInput({ [fieldOne]: user1, [fieldTwo]: user2 });

      const spaceRole = 'Manager';
      if (isSpace) {
        inviteUserStepper.setSpaceRole(2);
      }
      inviteUserStepper.next();

      usersTable.waitUntilShown();
      usersTable.waitForNoLoadingIndicator();

      testUser(user1, spaceRole);
      testUser(user2, spaceRole);

      browser.wait(cfHelper.fetchDefaultCfGuid().then(cfGuid => cfHelper.deleteUsers(cfGuid, defaultCf.testOrg, [user1, user2])));
    });


  });
}
