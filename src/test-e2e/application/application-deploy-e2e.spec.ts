import { browser, promise } from 'protractor';

import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageEventsTab } from './po/application-page-events.po';
import { ApplicationPageGithubTab } from './po/application-page-github.po';
import { ApplicationPageInstancesTab } from './po/application-page-instances.po';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { ApplicationPageSummaryTab } from './po/application-page-summary.po';
import { ApplicationPageVariablesTab } from './po/application-page-variables.po';
import { ApplicationBasePage } from './po/application-page.po';
import { CFPage } from '../po/cf-page.po';

let nav: SideNavigation;
let appWall: ApplicationsPage;
let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

const cfName = e2e.secrets.getDefaultCFEndpoint().name;
const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

describe('Application Deploy -', function () {

  const testApp = e2e.secrets.getDefaultCFEndpoint().testDeployApp || 'nwmac/cf-quick-app';
  const testAppName = ApplicationE2eHelper.createApplicationName();
  const testAppStack = e2e.secrets.getDefaultCFEndpoint().testDeployAppStack;
  let deployedCommit: promise.Promise<string>;
  let defaultStack = '';
  const appDetails = {
    cfGuid: '',
    appGuid: ''
  };

  beforeAll(() => {
    nav = new SideNavigation();
    appWall = new ApplicationsPage();
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    cfHelper = new CFHelpers(setup);
  });

  beforeAll(() => {
    return cfHelper.fetchDefaultStack(e2e.secrets.getDefaultCFEndpoint()).then(stack => defaultStack = stack);
  });

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  describe('Deploy process - ', () => {

    let originalTimeout = 40000;
    beforeAll(() => nav.goto(SideNavMenuItem.Applications));

    // Might take a bit longer to deploy the app than the global default timeout allows
    beforeEach(function () {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
    });

    afterEach(function () {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    // Allow up to 2 minutes for the application to be deployed
    describe('Should deploy app from GitHub', () => {

      const loggingPrefix = 'Application Deploy: Deploy from Github:';
      let deployApp;

      beforeAll(() => {
        // Should be on deploy app modal
        appWall.waitForPage();
        expect(appWall.isActivePage()).toBeTruthy();
        deployApp = appWall.clickDeployApp();
      });

      it('Check deploy steps', () => {
        expect(deployApp.header.getTitleText()).toBe('Deploy');
        // Check the steps
        e2e.debugLog(`${loggingPrefix} Checking Steps`);
        deployApp.stepper.getStepNames().then(steps => {
          expect(steps.length).toBe(5);
          expect(steps[0]).toBe('Cloud Foundry');
          expect(steps[1]).toBe('Source');
          expect(steps[2]).toBe('Source Config');
          expect(steps[3]).toBe('Overrides (Optional)');
          expect(steps[4]).toBe('Deploy');
        });
      });

      it('Should pass CF/Org/Space Step', () => {
        e2e.debugLog(`${loggingPrefix} Cf/Org/Space Step`);
        expect(deployApp.stepper.getActiveStepName()).toBe('Cloud Foundry');
        promise.all([
          deployApp.stepper.getStepperForm().getText('cf'),
          deployApp.stepper.getStepperForm().getText('org'),
          deployApp.stepper.getStepperForm().getText('space')
        ]).then(([cf, org, space]) => {
          if (cf !== 'Cloud Foundry' && org !== 'Organization' && space !== 'Space') {
            expect(deployApp.stepper.canNext()).toBeTruthy();
          } else {
            expect(deployApp.stepper.canNext()).toBeFalsy();
          }
        });

        // Fill in form
        deployApp.stepper.getStepperForm().fill({ 'cf': cfName });
        deployApp.stepper.getStepperForm().fill({ 'org': orgName });
        deployApp.stepper.getStepperForm().fill({ 'space': spaceName });
        expect(deployApp.stepper.canNext()).toBeTruthy();

        // Press next to get to source step
        deployApp.stepper.next();
      });

      it('Should pass Source step', () => {
        e2e.debugLog(`${loggingPrefix} Source Step`);
        expect(deployApp.stepper.getActiveStepName()).toBe('Source');
        expect(deployApp.stepper.canNext()).toBeFalsy();
        deployApp.stepper.getStepperForm().fill({ 'projectname': testApp });

        // Press next to get to source config step
        deployApp.stepper.waitUntilCanNext('Next');
        deployApp.stepper.next();
      });

      it('Should pass Source Config step', () => {
        e2e.debugLog(`${loggingPrefix} Source Config Step`);
        expect(deployApp.stepper.getActiveStepName()).toBe('Source Config');
        const commits = deployApp.getCommitList();
        expect(commits.getHeaderText()).toBe('Select a commit');

        expect(deployApp.stepper.canNext()).toBeFalsy();

        commits.getTableData().then(data => {
          expect(data.length).toBeGreaterThan(0);
        });

        commits.selectRow(0);
        e2e.debugLog(`${loggingPrefix} Select a commit (selected)`);

        deployedCommit = commits.getCell(0, 2).getText();
        expect(deployApp.stepper.canNext()).toBeTruthy();

        // Press next to get to overrides step
        deployApp.stepper.next();
      });

      it('Should pass Overrides step', () => {
        e2e.debugLog(`${loggingPrefix} Overrides Step`);
        expect(deployApp.stepper.canNext()).toBeTruthy();

        const overrides = deployApp.getOverridesForm();
        overrides.waitUntilShown();
        overrides.fill({ name: testAppName, random_route: true });

        e2e.debugLog(`${loggingPrefix} Overrides Step - overrides set`);
      });

      it('Should Deploy Application', () => {
        // Turn off waiting for Angular - the web socket connection is kept open which means the tests will timeout
        // waiting for angular if we don't turn off.
        browser.waitForAngularEnabled(false);

        // Press next to deploy the app
        deployApp.stepper.next();

        e2e.debugLog(`${loggingPrefix} Deploying Step (wait)`);

        // Wait for the application to be fully deployed - so we see any errors that occur
        deployApp.waitUntilDeployed();

        // Wait until app summary button can be pressed
        deployApp.stepper.waitUntilCanNext('Go to App Summary');

        e2e.debugLog(`${loggingPrefix} Deploying Step (after wait)`);
      }, 120000);

      it('Should go to App Summary Page', () => {
        // Click next
        deployApp.stepper.next();

        e2e.sleep(1000);
        e2e.debugLog(`${loggingPrefix} Waiting For Application Summary Page`);
        // Should be app summary
        const appSummaryPage = new CFPage('/applications/');
        appSummaryPage.waitForPageOrChildPage();
        appSummaryPage.header.waitForTitleText(testAppName);
        browser.wait(ApplicationBasePage.detect()
          .then(appSummary => {
            appDetails.cfGuid = appSummary.cfGuid;
            appDetails.appGuid = appSummary.appGuid;
          }), 10000, 'Failed to wait for Application Summary page after deploying application'
        );
      });
    });
  });

  describe('Tab Tests -', () => {

    beforeAll(() => {
      // Should be deployed, no web-socket open, so we can wait for angular agiain
      browser.waitForAngularEnabled(true);

      expect(appDetails.cfGuid).toBeDefined();
      expect(appDetails.appGuid).toBeDefined();
      // Fresh reload so that we know the app status is correct
      const appBasePage = new ApplicationBasePage(appDetails.cfGuid, appDetails.appGuid);
      return appBasePage.navigateTo();
    });

    it('Variables Tab', () => {
      const appVariables = new ApplicationPageVariablesTab(appDetails.cfGuid, appDetails.appGuid);
      appVariables.goToVariablesTab();

      expect(appVariables.list.empty.getDefault().isPresent()).toBeFalsy();
      expect(appVariables.list.table.getRows().count()).toBe(1);
      expect(appVariables.list.table.getCell(0, 1).getText()).toBe('STRATOS_PROJECT');
      expect(appVariables.list.table.getCell(0, 2).getText()).not.toBeNull();
    });

    it('Github Tab', () => {
      const appGithub = new ApplicationPageGithubTab(appDetails.cfGuid, appDetails.appGuid);
      appGithub.goToGithubTab();

      expect(appGithub.cardDeploymentInfo.repo.getValue()).toBe(testApp);
      expect(appGithub.cardDeploymentInfo.branch.getValue()).toBe('master');
      appGithub.cardDeploymentInfo.commit.getValue().then(commit => {
        expect(commit).not.toBeNull();
        expect(commit.length).toBe(8);
      });

      expect(appGithub.cardRepoInfo.name.getValue()).toBe(testApp);
      expect(appGithub.cardRepoInfo.owner.getValue()).toBe(testApp.substring(0, testApp.indexOf('/')));
      expect(appGithub.cardRepoInfo.description.getValue()).not.toBeFalsy();

      appGithub.cardCommitInfo.sha.getValue().then(commit => {
        expect(commit).not.toBeNull();
        expect(commit.length).toBe(8);
      });

      expect(appGithub.commits.empty.getDefault().isPresent()).toBeFalsy();
      expect(appGithub.commits.empty.getCustom().isPresent()).toBeFalsy();

      // Check that whatever the sha we selected earlier matches the sha in the deploy info, commit details and highlighted table row
      expect(deployedCommit).toBeTruthy('deployedCommit info is missing (has the deploy test run?)');
      if (deployedCommit) {
        deployedCommit.then(commitSha => {
          expect(appGithub.cardDeploymentInfo.commit.getValue()).toBe(commitSha);
          expect(appGithub.cardCommitInfo.sha.getValue()).toBe(commitSha);

          appGithub.commits.table.getHighlightedRow().then(index => {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(appGithub.commits.table.getCell(index, 1).getText()).toEqual(commitSha);
          });
        });
      }
    });
  });

  it('App Summary', () => {
    // Does app to be fully started
    const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.appGuid);
    appSummary.goToSummaryTab();

    appSummary.cardStatus.getStatus().then(res => {
      expect(res.status).toBe('Deployed');
      expect(res.subStatus).toBe('Online');
    });

    appSummary.cardInstances.waitForRunningInstancesText('1 / 1');

    expect(appSummary.cardUptime.getTitle()).not.toBe('Application is not running');
    expect(appSummary.cardUptime.getUptime().isDisplayed()).toBeTruthy();
    expect(appSummary.cardUptime.getUptimeText()).not.toBeNull();

    expect(appSummary.cardInfo.memQuota.getValue()).toBe('16 MB');
    expect(appSummary.cardInfo.diskQuota.getValue()).toBe('64 MB');
    expect(appSummary.cardInfo.appState.getValue()).toBe('STARTED');
    expect(appSummary.cardInfo.packageState.getValue()).toBe('STAGED');
    expect(appSummary.cardInfo.services.getValue()).toBe('0');
    expect(appSummary.cardInfo.routes.getValue()).toBe('1');

    expect(appSummary.cardCfInfo.cf.getValue()).toBe(cfName);
    expect(appSummary.cardCfInfo.org.getValue()).toBe(orgName);
    expect(appSummary.cardCfInfo.space.getValue()).toBe(spaceName);

    expect(appSummary.cardBuildInfo.buildPack.getValue()).toBe('binary_buildpack');
    expect(appSummary.cardBuildInfo.stack.getValue()).toBe(testAppStack || defaultStack);

    appSummary.cardDeployInfo.waitForTitle('Deployment Info');
    appSummary.cardDeployInfo.github.waitUntilShown('Waiting for GitHub deployment information');
    expect(appSummary.cardDeployInfo.github.isDisplayed()).toBeTruthy();
    appSummary.cardDeployInfo.github.getValue().then(commitHash => {
      expect(commitHash).toBeDefined();
      expect(commitHash.length).toBe(8);
    });

  });

  it('Instances Tab', () => {
    // Does app to be fully started
    const appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.appGuid);
    appInstances.goToInstancesTab();

    appInstances.cardStatus.getStatus().then(res => {
      expect(res.status).toBe('Deployed');
      expect(res.subStatus).toBe('Online');
    });

    appInstances.cardInstances.waitForRunningInstancesText('1 / 1');

    expect(appInstances.cardUsage.getTitleElement().isPresent()).toBeFalsy();
    expect(appInstances.cardUsage.getUsageTable().isDisplayed()).toBeTruthy();

    expect(appInstances.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');

  });

  it('Routes Tab', () => {
    const appRoutes = new ApplicationPageRoutesTab(appDetails.cfGuid, appDetails.appGuid);
    appRoutes.goToRoutesTab();

    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();
    appRoutes.list.table.getCell(0, 1).getText().then((route: string) => {
      expect(route).not.toBeNull();
      expect(route.length).toBeGreaterThan(testAppName.length);
      const randomRouteStyleAppName = testAppName.replace(/[\.:]/g, '');
      expect(route.startsWith(randomRouteStyleAppName)).toBeTruthy();
    });
    appRoutes.list.table.getCell(0, 2).getText().then((tcpRoute: string) => {
      expect(tcpRoute).not.toBeNull();
      expect(tcpRoute).toBe('No');
    });
  });

  it('Events Tab', () => {
    // Does app to be fully started
    const appEvents = new ApplicationPageEventsTab(appDetails.cfGuid, appDetails.appGuid);
    appEvents.goToEventsTab();

    expect(appEvents.list.empty.isDisplayed()).toBeFalsy();
    expect(appEvents.list.isTableView()).toBeTruthy();
    expect(appEvents.list.getTotalResults()).toBeGreaterThanOrEqual(2);
    // Ensure that the earliest events are at the top
    appEvents.list.table.toggleSort('Timestamp');

    const currentUser = e2e.secrets.getDefaultCFEndpoint().creds.nonAdmin.username;
    // Create
    expect(appEvents.list.table.getCell(0, 1).getText()).toBe('audit\napp\ncreate');
    expect(appEvents.list.table.getCell(0, 2).getText()).toBe(`person\n${currentUser}`);
    // Map Route
    expect(appEvents.list.table.getCell(1, 1).getText()).toBe('audit\napp\nmap-route');
    expect(appEvents.list.table.getCell(1, 2).getText()).toBe(`person\n${currentUser}`);
    // Update (route)
    expect(appEvents.list.table.getCell(2, 1).getText()).toBe('audit\napp\nupdate');
    expect(appEvents.list.table.getCell(2, 2).getText()).toBe(`person\n${currentUser}`);
  });

  describe('Instance scaling', () => {
    let appInstances;

    beforeAll(() => {
      appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.appGuid);
      appInstances.goToInstancesTab();
    });

    it('Should show correct initial state', () => {
      // Initial state
      appInstances.cardStatus.getStatus().then(res => {
        expect(res.status).toBe('Deployed');
        expect(res.subStatus).toBe('Online');
      });
      appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
      expect(appInstances.cardInstances.editCountButton().isDisplayed()).toBeTruthy();
      expect(appInstances.cardInstances.decreaseCountButton().isDisplayed()).toBeTruthy();
      expect(appInstances.cardInstances.increaseCountButton().isDisplayed()).toBeTruthy();
    });

    it('Should scale up using edit form', () => {
      // Scale using edit count form
      appInstances.cardInstances.editInstanceCount(2);
      appInstances.cardInstances.waitForRunningInstancesText('2 / 2');
      expect(appInstances.list.getTotalResults()).toBe(2);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
      expect(appInstances.list.table.getCell(1, 1).getText()).toBe('RUNNING');
    });

    it('Should scale down using edit form', () => {
      // Scale using edit count form
      appInstances.cardInstances.editInstanceCount(1);
      appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appInstances.list.getTotalResults()).toBe(1);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
    });

    it('Should scale to zero using - button', () => {
      // Scale using +/- buttons
      expect(appInstances.cardInstances.decreaseCountButton().isDisplayed()).toBeTruthy();
      appInstances.cardInstances.decreaseCountButton().click();
      const confirm = new ConfirmDialogComponent();
      confirm.waitUntilShown();
      expect(confirm.getMessage()).toBe('Are you sure you want to set the instance count to 0?');
      confirm.confirm();
      appInstances.cardInstances.waitForRunningInstancesText('0 / 0');
      // Content of empty instance table is tested elsewhere
      expect(appInstances.list.getTotalResults()).toBe(0);
    });

    it('Should scale to 1 using + button', () => {
      expect(appInstances.cardInstances.increaseCountButton().isDisplayed()).toBeTruthy();
      appInstances.cardInstances.increaseCountButton().click();
      appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appInstances.list.getTotalResults()).toBe(1);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
    });
  });

  it('Instance termination', () => {
    const appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.appGuid);
    appInstances.goToInstancesTab();

    // Initial state
    appInstances.cardStatus.getStatus().then(res => {
      expect(res.status).toBe('Deployed');
      expect(res.subStatus).toBe('Online');
    });
    appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
    expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');

    // Terminate an instance
    appInstances.list.table.openRowActionMenuByIndex(0).clickItem('Terminate');
    const confirm = new ConfirmDialogComponent();
    confirm.waitUntilShown();
    expect(confirm.getMessage()).toBe('Are you sure you want to terminate instance 0?');
    confirm.confirm();
  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
