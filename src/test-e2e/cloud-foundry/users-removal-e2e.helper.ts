import { browser, promise, by, element } from 'protractor';
import { protractor } from 'protractor/built/ptor';

import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { E2EHelpers } from '../helpers/e2e-helpers';
import { CFUsersListComponent, UserRoleChip } from '../po/cf-users-list.po';
import { setUpTestOrgSpaceE2eTest } from './users-list-e2e.helper';
import { RemoveUsersPage } from './remove-users-page.po';
import { StepperComponent } from '../po/stepper.po';

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

export function setupCfUserRemovalTests(
  cfLevel: CfUserRemovalTestLevel,
  removalLevel: CfRolesRemovalLevel,
  navToUserTableFn: (cfGuid: string, orgGuid: string, spaceGuid: string) => promise.Promise<any>
) {
  const orgName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const spaceName = E2EHelpers.createCustomName(customOrgSpacesLabel);
  const userName = e2e.secrets.getDefaultCFEndpoint().creds.removeUser.username;

  let removeUsersPage: RemoveUsersPage;
  let removeUsersStepper: StepperComponent;
  let cfHelper: CFHelpers;
  let cfGuid: string;
  let orgGuid: string;
  let spaceGuid: string;
  let userGuid: string;

  beforeAll(() => {
    setUpTestOrgSpaceE2eTest(orgName, spaceName, userName, true).then(res => {
      cfHelper = res.cfHelper;
      cfGuid = res.cfGuid;
      orgGuid = res.orgGuid;
      spaceGuid = res.spaceGuid;

      return cfHelper.fetchUser(cfGuid, userName).then(user => {
        expect(user).toBeTruthy();
        userGuid = user.metadata.guid;
      });
    });

    removeUsersPage = new RemoveUsersPage(cfGuid, orgGuid, spaceGuid, userGuid);

    return protractor.promise.controlFlow().execute(() => {
      return navToUserTableFn(cfGuid, orgGuid, spaceGuid);
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
        ...createReservedActionTableDate('Org: test-e2e', 'Space: test-e2e'),
        ...createReservedActionTableDate('Org: e2e', 'Space: e2e'),
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
        ...createReservedActionTableDate('Org: test-e2e', 'Space: test-e2e', 'done'),
        ...createReservedActionTableDate('Org: e2e', 'Space: e2e', 'done'),
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

  function createReservedActionTableDate(orgTarget, spaceTarget, stateIcon = '') {
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
    ];

    // spaces were already removed (see cf-level/cf-users-removal-e2e.spec.ts),
    // so we ignore even knowing that they would be there in a normal case (see createActionTableDate below)
    if (removalLevel === CfRolesRemovalLevel.OrgsSpaces) {
      return orgActions;
    }

    return spaceActions;
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

  afterAll(() => cfHelper.deleteOrgIfExisting(cfGuid, orgName));
}
