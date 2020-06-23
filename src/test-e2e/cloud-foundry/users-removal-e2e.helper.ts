import { browser, by, element, promise } from 'protractor';
import { protractor } from 'protractor/built/ptor';

import { CfUser } from '../../frontend/packages/cloud-foundry/src/store/types/cf-user.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
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
        return setUpTestOrgSpaceE2eTest(orgName, spaceName, userName, true, e2eSetup);
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
      .then(() => {
        removeUsersPage = new RemoveUsersPage(cfGuid, orgGuid, spaceGuid, userGuid);
        return protractor.promise.controlFlow().execute(() => {
          return navToUserTableFn(cfGuid, orgGuid, spaceGuid);
        });
      })
      .then(() => e2e.log(`Nav'd to user table`));
  }, 75000);

  it('Clicks on remove menu option', () => {
    const usersTable = new CFUsersListComponent();
    usersTable.header.setSearchText(userName);
    usersTable.waitForTotalResultsToBe(1, 10000, `Failed to find user in table: ${userName}`);

    if (removalLevel === CfRolesRemovalLevel.OrgsSpaces) {
      usersTable.table.openRowActionMenuByIndex(0).clickItem('Remove from org');
    } else {
      usersTable.table.openRowActionMenuByIndex(0).clickItem('Remove from space');
    }

    removeUsersStepper = removeUsersPage.stepper;
    removeUsersStepper.waitUntilShown('Remove Users Stepper');

    // ... check button state
    expect(removeUsersStepper.canPrevious()).toBeFalsy('Previous button should not be visible');
    expect(removeUsersStepper.canCancel()).toBeTruthy('Cancel button should be visible and enabled');
    expect(removeUsersStepper.canNext()).toBeTruthy('Next button should be visible and enabled');
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

    expect(confirmStep.actionTable.table.getTableData()).toEqual(actionTableDate, 'Table data did not match expected content');
    expect(removeUsersStepper.canPrevious()).toBeFalsy('Previous button should not be visible');
    expect(removeUsersStepper.canCancel()).toBeTruthy('Cancel button should be visible and enabled');
    expect(removeUsersStepper.canNext()).toBeTruthy('Next button should be visible and enabled');


    // apply roles removal changes
    removeUsersStepper.next();

    confirmStep.actionTable.table.waitUntilNotBusy('Failed to wait for busy state');

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

    expect(confirmStep.actionTable.table.getTableData()).toEqual(actionTableDate, 'Table data did not match expected content');
    expect(removeUsersStepper.canPrevious()).toBeFalsy('Previous button should not be visible');
    expect(removeUsersStepper.canCancel()).toBeFalsy('Cancel button should not be visible//enabled');
    expect(removeUsersStepper.canNext()).toBeTruthy('Next button should be visible and enabled');

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
    it(`Doesn't show user with roles any more`, () => {
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
      deleteUser.then(() => e2e.log(`Deleted Cf user ${userGuid} & UAA user ${uaaUserGuid}`)),
      cfHelper.deleteOrgIfExisting(cfGuid, orgName).then(() => e2e.log(`Deleted Org: ${orgName}`))
    ]);
  });
}
