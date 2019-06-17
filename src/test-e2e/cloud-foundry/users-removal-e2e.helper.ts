import { browser, by, element, promise } from 'protractor';
import { protractor } from 'protractor/built/ptor';

import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { UaaHelpers } from '../helpers/uaa-helpers';
import { CFUsersListComponent } from '../po/cf-users-list.po';
import { StepperComponent } from '../po/stepper.po';
import { RemoveUsersPage } from './remove-users-page.po';
import { setUpTestOrgSpaceE2eTest } from './users-list-e2e.helper';

export enum CfUserRemovalTestLevel {
  Cf = 1,
  Org = 2,
  Space = 3
}

export enum CfRolesRemovalLevel {
  OrgsSpaces = 1,
  Spaces = 2
}

const customOrgSpacesLabel = E2EHelpers.e2eItemPrefix + (process.env.CUSTOM_APP_LABEL || process.env.USER) + '-remove-users';

// Use the same helper to avoid fetching the token multiple times
const uaaHelpers = new UaaHelpers();

export function setupCfUserRemovalTests(
  cfLevel: CfUserRemovalTestLevel,
  removalLevel: CfRolesRemovalLevel,
  navToUserTableFn: (cfGuid: string, orgGuid: string, spaceGuid: string) => promise.Promise<any>
) {
  const uniqueName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const orgName = uniqueName;
  const spaceName = uniqueName;
  const userName = uniqueName;

  let removeUsersPage: RemoveUsersPage;
  let removeUsersStepper: StepperComponent;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let spaceGuid: string;
  let userGuid: string;
  let uaaUserGuid: string;

  beforeAll(() => {
    const e2eSetup = e2e.setup(ConsoleUserType.admin)
    .clearAllEndpoints()
    .registerDefaultCloudFoundry()
    .connectAllEndpoints(ConsoleUserType.admin)
    .loginAs(ConsoleUserType.admin)
    .getInfo(ConsoleUserType.admin);
    cfHelper = new CFHelpers(e2eSetup);


    return uaaHelpers.setup()
      .then(() => uaaHelpers.createUser(userName))
      .then(newUser => {
        uaaUserGuid = newUser.id;
        const defaultCf = e2e.secrets.getDefaultCFEndpoint();
        cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      })
      .then(() => cfHelper.createUser(cfGuid, uaaUserGuid))
      .then(() => setUpTestOrgSpaceE2eTest(orgName, spaceName, userName, true, e2eSetup))
      .then(res => {
        cfGuid = res.cfGuid;
        orgGuid = res.orgGuid;
        spaceGuid = res.spaceGuid;
        return cfHelper.fetchUser(cfGuid, userName);
      })
      .then(user => {
        expect(user).toBeTruthy();
        userGuid = user.metadata.guid;

        removeUsersPage = new RemoveUsersPage(cfGuid, orgGuid, spaceGuid, userGuid);

        return protractor.promise.controlFlow().execute(() => {
          return navToUserTableFn(cfGuid, orgGuid, spaceGuid);
        });
      });
  });

  it ('Clicks on remove menu option', () => {
    const usersTable = new CFUsersListComponent();
    usersTable.header.setSearchText(userName);
    expect(usersTable.getTotalResults()).toBe(1);

    if (removalLevel === CfRolesRemovalLevel.OrgsSpaces) {
      usersTable.table.openRowActionMenuByIndex(0).clickItem('Remove from org');
    } else {
      usersTable.table.openRowActionMenuByIndex(0).clickItem('Remove from space');
    }

    removeUsersStepper = removeUsersPage.stepper;

    // ... check button state
    expect(removeUsersStepper.canPrevious()).toBeFalsy();
    expect(removeUsersStepper.canCancel()).toBeTruthy();
    expect(removeUsersStepper.canNext()).toBeTruthy();
  });

  it('Confirm roles removal', () => {
    // confirm step
    const confirmStep = removeUsersPage.confirmStep;

    const orgTarget = `Org: ${orgName}`;
    const spaceTarget = `Space: ${spaceName}`;

    // ... initial action table state
    let actionTableDate: any[];

    if (cfLevel === CfUserRemovalTestLevel.Cf) {
      actionTableDate = [
        ...createActionTableDate(orgTarget, spaceTarget)
      ];
    } else {
      actionTableDate = createActionTableDate(orgTarget, spaceTarget);
    }

    expect(confirmStep.actionTable.table.getTableData()).toEqual(actionTableDate);
    expect(removeUsersStepper.canPrevious()).toBeFalsy();
    expect(removeUsersStepper.canCancel()).toBeTruthy();
    expect(removeUsersStepper.canNext()).toBeTruthy();

    // apply roles removal changes
    removeUsersStepper.next();

    // Wait until all of the spinners have gone
    const spinners = element.all(by.tagName('mat-progress-spinner'));
    browser.wait(() => spinners.isPresent().then((present) => !present));

    // ... action table state after submit
    if (cfLevel === CfUserRemovalTestLevel.Cf) {
      actionTableDate = [
        ...createActionTableDate(orgTarget, spaceTarget, 'done')
      ];
    } else {
      actionTableDate = createActionTableDate(orgTarget, spaceTarget, 'done');
    }

    expect(confirmStep.actionTable.table.getTableData()).toEqual(actionTableDate);
    expect(removeUsersStepper.canPrevious()).toBeFalsy();
    expect(removeUsersStepper.canCancel()).toBeFalsy();
    expect(removeUsersStepper.canNext()).toBeTruthy();

    // close
    removeUsersStepper.next();
    removeUsersStepper.waitUntilNotShown();
  });

  if (cfLevel !== CfUserRemovalTestLevel.Space &&
      removalLevel === CfRolesRemovalLevel.Spaces) {

    it('Shows user with org roles only', () => {
      // user was removed from space level
      const usersTable = new CFUsersListComponent();
      usersTable.header.setSearchText(userName);

      expect(usersTable.getTotalResults()).toBe(1);
      expect(usersTable.getPermissions(0, false).getChipElements().count()).toBe(0);
    });
  } else {
    it('Doesnt show user with roles anymore', () => {
      const usersTable = new CFUsersListComponent();
      usersTable.header.setSearchText(userName);

      expect(usersTable.getTotalResults()).toBe(0);
    });
  }

  function createActionTableDate(orgTarget, spaceTarget, stateIcon = '') {
    const orgActions = [
      {
        user: userName,
        action: 'remove_circle\nRemove',
        role: 'Manager',
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
        role: 'User',
        target: orgTarget,
        'column-4': stateIcon
      }
    ];

    const spaceActions = [
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
      }
    ];

    if (removalLevel === CfRolesRemovalLevel.OrgsSpaces) {
      return [
        ...orgActions,
        ...spaceActions
      ];
    }

    return spaceActions;
  }

  afterAll(() => {
    const deleteUser = uaaUserGuid ? cfHelper.deleteUser(cfGuid, userGuid, userName, uaaUserGuid) : promise.fullyResolved(true);
    return promise.all([
      deleteUser,
      cfHelper.deleteOrgIfExisting(cfGuid, orgName)
    ]) ;
  });
}
