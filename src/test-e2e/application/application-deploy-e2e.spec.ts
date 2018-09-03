import { browser, promise, protractor } from 'protractor';

import { IApp } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
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

const until = protractor.ExpectedConditions;

let nav: SideNavigation;
let appWall: ApplicationsPage;
let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

const cfName = e2e.secrets.getDefaultCFEndpoint().name;
const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

const appName = 'cf-quick-app';

describe('Application Deploy -', function () {

  const testApp = e2e.secrets.getDefaultCFEndpoint().testDeployApp || 'nwmac/cf-quick-app';
  const testAppStack = e2e.secrets.getDefaultCFEndpoint().testDeployAppStack || 'opensuse42';
  let deployedCommit: promise.Promise<string>;

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

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  describe('Deploy process - ', () => {
    beforeEach(() => nav.goto(SideNavMenuItem.Applications));

    it('Should deploy app from GitHub', () => {
      const loggingPrefix = 'Application Deploy: Deploy from Github:';
      expect(appWall.isActivePage()).toBeTruthy();

      // Should be on deploy app modal
      const deployApp = appWall.clickDeployApp();
      expect(deployApp.header.getTitleText()).toBe('Deploy');

      // Check the steps
      e2e.log(`${loggingPrefix} Checking Steps`);
      deployApp.stepper.getStepNames().then(steps => {
        expect(steps.length).toBe(4);
        expect(steps[0]).toBe('Cloud Foundry');
        expect(steps[1]).toBe('Source');
        expect(steps[2]).toBe('Source Config');
        expect(steps[3]).toBe('Deploy');
      });
      e2e.log(`${loggingPrefix} Cf/Org/Space Step`);
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
      deployApp.stepper.next();

      e2e.log(`${loggingPrefix} Source Step`);
      expect(deployApp.stepper.getActiveStepName()).toBe('Source');
      expect(deployApp.stepper.canNext()).toBeFalsy();
      deployApp.stepper.getStepperForm().fill({ 'projectname': testApp });

      deployApp.stepper.waitUntilCanNext('Next');
      deployApp.stepper.next();

      e2e.log(`${loggingPrefix} Source Config Step`);
      expect(deployApp.stepper.getActiveStepName()).toBe('Source Config');

      const commits = deployApp.getCommitList();
      expect(commits.getHeaderText()).toBe('Select a commit');

      expect(deployApp.stepper.canNext()).toBeFalsy();

      commits.getTableData().then(data => {
        expect(data.length).toBeGreaterThan(0);
      });

      commits.selectRow(0);
      e2e.log(`${loggingPrefix} Select a commit (selected)`);

      deployedCommit = commits.getCell(0, 2).getText();
      expect(deployApp.stepper.canNext()).toBeTruthy();

      // Turn off waiting for Angular - the web socket connection is kept open which means the tests will timeout
      // waiting for angular if we don't turn off.
      browser.waitForAngularEnabled(false);

      // Press next to deploy the app
      deployApp.stepper.next();

      e2e.log(`${loggingPrefix} Deploying Step (wait)`);
      // Wait until app summary button can be pressed
      deployApp.stepper.waitUntilCanNext('Go to App Summary');

      e2e.log(`${loggingPrefix} Deploying Step (after wait)`);
      // Click next
      deployApp.stepper.next();

      e2e.log(`${loggingPrefix} Waiting For Application Summary Page`);
      // Should be app summary
      browser.wait(ApplicationBasePage.detect()
        .then(appSummary => {
          browser.waitForAngularEnabled(true);

          appSummary.waitForPage();
          appSummary.header.waitForTitleText(appName);
          return appSummary.cfGuid;
        })
      );

    });
  });

  // This is a bit of a hijack to test app tabs with a started app without going through a second long deploy app process
  describe('Deploy result -', () => {

    let appDetails: {
      cfGuid: string;
      app: APIResource<IApp>;
    };

    let appBasePage: ApplicationBasePage;

    beforeAll(() => {
      browser.wait(applicationE2eHelper.fetchAppInDefaultOrgSpace(appName)
        .then(res => {
          expect(res).toBeTruthy('Failed to fetch app, is it deployed in the default space?');
          return res;
        })
        .then(res => { appDetails = res; })
        .then(() => {
          appBasePage = new ApplicationBasePage(appDetails.cfGuid, appDetails.app.metadata.guid);
          return appBasePage.navigateTo();
        })
      );
    });

    // Two sets of tests, those that require app to be started and those that don't. The app can take a while to start so run those
    // that don't need a started app first

    describe('App Not Started Tests -', () => {

      it('Variables Tab', () => {
        const appVariables = new ApplicationPageVariablesTab(appDetails.cfGuid, appDetails.app.metadata.guid);
        appVariables.goToVariablesTab();

        expect(appVariables.list.empty.getDefault().isPresent()).toBeFalsy();
        expect(appVariables.list.table.getRows().count()).toBe(1);
        expect(appVariables.list.table.getCell(0, 1).getText()).toBe('STRATOS_PROJECT');
        expect(appVariables.list.table.getCell(0, 2).getText()).not.toBeNull();
      });

      it('Github Tab', () => {
        const appGithub = new ApplicationPageGithubTab(appDetails.cfGuid, appDetails.app.metadata.guid);
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

    describe('App Started Tests -', () => {

      beforeAll(() => {
        const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.app.metadata.guid);
        appSummary.goToSummaryTab();
        e2e.log('Waiting for app status to be `Deployed - Online`');
        appSummary.cardStatus.waitForStatus('Deployed');
        appSummary.cardStatus.waitForSubStatus('Online');
      });

      it('App Summary', () => {
        // Does app to be fully started
        const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.app.metadata.guid);
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
        expect(appSummary.cardBuildInfo.stack.getValue()).toBe(testAppStack);

        appSummary.cardDeployInfo.waitForTitle('Deployment Info');
        expect(appSummary.cardDeployInfo.github.isDisplayed()).toBeTruthy();
        appSummary.cardDeployInfo.github.getValue().then(commitHash => {
          expect(commitHash).toBeDefined();
          expect(commitHash.length).toBe(8);
        });

      });

      it('Instances Tab', () => {
        // Does app to be fully started
        const appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.app.metadata.guid);
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
        const appRoutes = new ApplicationPageRoutesTab(appDetails.cfGuid, appDetails.app.metadata.guid);
        appRoutes.goToRoutesTab();

        expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
        expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();
        appRoutes.list.table.getCell(0, 1).getText().then((route: string) => {
          expect(route).not.toBeNull();
          expect(route.length).toBeGreaterThan(appName.length);
          expect(route.startsWith(appName)).toBeTruthy();
        });
        appRoutes.list.table.getCell(0, 2).getText().then((tcpRoute: string) => {
          expect(tcpRoute).not.toBeNull();
          expect(tcpRoute).toBe('No');
        });
      });

      it('Events Tab', () => {
        // Does app to be fully started
        const appEvents = new ApplicationPageEventsTab(appDetails.cfGuid, appDetails.app.metadata.guid);
        appEvents.goToEventsTab();

        expect(appEvents.list.empty.isDisplayed()).toBeFalsy();
        expect(appEvents.list.isTableView()).toBeTruthy();
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
        // Update (started)
        expect(appEvents.list.table.getCell(3, 1).getText()).toBe('audit\napp\nupdate');
        expect(appEvents.list.table.getCell(3, 2).getText()).toBe(`person\n${currentUser}`);
      });
    });



    it('Instance scaling', () => {
      const appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.app.metadata.guid);
      appInstances.goToInstancesTab();

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

      // Scale using edit count form
      appInstances.cardInstances.editInstanceCount(2);
      appInstances.cardInstances.waitForRunningInstancesText('2 / 2');
      expect(appInstances.list.getTotalResults()).toBe(2);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
      expect(appInstances.list.table.getCell(1, 1).getText()).toBe('RUNNING');

      appInstances.cardInstances.editInstanceCount(1);
      appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appInstances.list.getTotalResults()).toBe(1);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');

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

      expect(appInstances.cardInstances.decreaseCountButton().isDisplayed()).toBeTruthy();
      appInstances.cardInstances.increaseCountButton().click();
      appInstances.cardInstances.waitForRunningInstancesText('1 / 1');
      expect(appInstances.list.getTotalResults()).toBe(1);
      expect(appInstances.list.table.getCell(0, 1).getText()).toBe('RUNNING');
    });

    it('Instance termination', () => {
      const appInstances = new ApplicationPageInstancesTab(appDetails.cfGuid, appDetails.app.metadata.guid);
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
      appInstances.cardInstances.waitForRunningInstancesText('0 / 1');
      expect(appInstances.list.getTotalResults()).toBe(0);
    });

  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName }));

});
