import { browser, promise } from 'protractor';

import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { createApplicationDeployTests } from './application-deploy-helper';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageEventsTab } from './po/application-page-events.po';
import { ApplicationPageGithubTab } from './po/application-page-github.po';
import { ApplicationPageInstancesTab } from './po/application-page-instances.po';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { ApplicationPageSummaryTab } from './po/application-page-summary.po';
import { ApplicationPageVariablesTab } from './po/application-page-variables.po';
import { ApplicationBasePage } from './po/application-page.po';
import { DeployApplication } from './po/deploy-app.po';

let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

describe('Application Deploy -', () => {

  const testAppStack = e2e.secrets.getDefaultCFEndpoint().testDeployAppStack;
  let defaultStack = '';

  beforeAll(() => {
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
    return cfHelper.fetchDefaultCFEndpointStack().then(stack => defaultStack = stack);
  });

  afterAll(() => {
    browser.waitForAngularEnabled(true);
  });

  const deployRes = createApplicationDeployTests();
  const { testApp, testAppName, appDetails } = deployRes;

  describe('Tab Tests (app status independent) -', () => {
    // These tests don't rely on the app status

    beforeAll(() => {
      // Should be deployed, no web-socket open, so we can wait for angular again
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

      // Existing env var
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
      expect(deployRes.deployedCommit).toBeTruthy('deployedCommit info is missing (has the deploy test run?)');
      if (deployRes.deployedCommit) {
        deployRes.deployedCommit.then(commitSha => {
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

  describe('Tab Tests (app status dependent) -', () => {

    it('App Summary', () => {
      // Does app to be fully started
      const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.appGuid);
      appSummary.goToSummaryTab();

      appSummary.cardStatus.getStatus().then(res => {
        expect(res.status).toBe('Deployed');
        expect(res.subStatus).toBe('Online');
      });

      appSummary.cardInstances.waitForRunningInstancesText('1 / 1');

      const cfName = e2e.secrets.getDefaultCFEndpoint().name;
      const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
      const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

      expect(appSummary.cardCfInfo.cf.getValue()).toBe(cfName);
      expect(appSummary.cardCfInfo.org.getValue()).toBe(orgName);
      expect(appSummary.cardCfInfo.space.getValue()).toBe(spaceName);

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
        expect(route.startsWith(randomRouteStyleAppName.substring(0, randomRouteStyleAppName.length - 11), 7)).toBeTruthy();
      });
      appRoutes.list.table.getCell(0, 2).getText().then((tcpRoute: string) => {
        expect(tcpRoute).not.toBeNull();
        expect(tcpRoute).toBe('highlight_off');
      });
    });

    it('Events Tab', () => {
      // Does app to be fully started
      const appEvents = new ApplicationPageEventsTab(appDetails.cfGuid, appDetails.appGuid);
      appEvents.goToEventsTab();

      expect(appEvents.list.empty.isDisplayed()).toBeFalsy();
      expect(appEvents.list.isTableView()).toBeTruthy();
      expect(appEvents.list.getTotalResults()).toBeGreaterThanOrEqual(3);
      // Ensure that the earliest events are at the top
      appEvents.list.table.toggleSort('Timestamp');

      const currentUser = e2e.secrets.getDefaultCFEndpoint().creds.nonAdmin.username;

      const checkEventTableItem = (data: { [columnHeader: string]: string }[], text) => {
        const item = data.find(i => i.type === text);
        expect(item).toBeDefined();
        expect(item.actor).toBe(`person\n${currentUser}`);
      };

      // Don't worry about order of events
      appEvents.list.table.getTableData().then(data => {
        // Create
        checkEventTableItem(data, 'audit\napp\ncreate');
        // Lifecycle - buildpack(s)
        checkEventTableItem(data, 'audit\napp\nupdate');
        // Map Route
        checkEventTableItem(data, 'audit\napp\nmap-route');
        // Upload bits
        checkEventTableItem(data, 'audit\napp\nupload-bits');
        // Build Create
        checkEventTableItem(data, 'audit\napp\nbuild\ncreate');
      });
    });
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

  describe('Redeploy', () => {

    let pRedeployHash: promise.Promise<string>;
    const deployApp: DeployApplication = new DeployApplication();

    it('Should reach deploy stepper from git tab', () => {
      const appGithub = new ApplicationPageGithubTab(appDetails.cfGuid, appDetails.appGuid);
      appGithub.goToGithubTab();


      const pCurrentCommitRow = appGithub.commits.table.getHighlightedRow();
      expect(pCurrentCommitRow).toBeGreaterThanOrEqual(0);

      // Initial deploy should be HEAD of master, so top row
      const pDeployedHash = appGithub.commits.table.getCell(0, 1).getText();

      pRedeployHash = appGithub.commits.table.getCell(1, 1).getText();
      expect(pRedeployHash).not.toBe(pDeployedHash);
      pRedeployHash.then(redeployHash => {
        expect(redeployHash).toBeDefined();
        expect(redeployHash.length).toBe(8);
      });

      const menu = appGithub.commits.table.openRowActionMenuByIndex(1);
      menu.waitUntilShown();
      menu.clickItem('Deploy');
      return deployApp.waitForChildPage('?appGuid=');

    });

    it('Should be source step with correct values', () => {
      deployApp.header.waitForTitleText('Redeploy');

      deployApp.stepper.getStepNames().then(steps => {
        expect(steps.length).toBe(3);
        expect(steps[0]).toBe('Source');
        expect(steps[1]).toBe('Overrides (Optional)');
        expect(steps[2]).toBe('Redeploy');
      });

      expect(deployApp.stepper.getActiveStepName()).toBe('Source');
      expect(deployApp.stepper.canNext()).toBeTruthy();

      return deployApp.stepper.getStepperForm().getFieldsMapped().then(fields => {
        fields.forEach(field => {
          switch (field.placeholder) {
            case 'Project':
              expect(field.value).toBe(testApp);
              break;
            case 'Branch':
              expect(field.text).toBe('master');
              break;
            default:
              fail(`Unknown field: ${field.placeholder}`);
              break;
          }
        });
        expect(deployApp.sourceStepGetRedeployCommit()).toBe(pRedeployHash);
      });
    });

    it('Should deploy successfully', () => {
      deployApp.stepper.next();

      const overrides = deployApp.getOverridesForm();
      overrides.waitUntilShown();

      deployApp.stepper.next();

      // Turn off waiting for Angular - the web socket connection is kept open which means the tests will timeout
      // waiting for angular if we don't turn off.
      browser.waitForAngularEnabled(false);

      // Press next to deploy the app
      deployApp.stepper.next();

      // Wait for the application to be fully deployed - so we see any errors that occur
      deployApp.waitUntilDeployed();

      // Wait until app summary button can be pressed
      deployApp.stepper.waitUntilCanNext('Go to App Summary');
      deployApp.stepper.next();
    });

    it('Should have correct commit after deploy', () => {

      const appSummary = new ApplicationPageSummaryTab(appDetails.cfGuid, appDetails.appGuid);
      // Reload page at app summary, just in case of caching
      appSummary.navigateTo();
      appSummary.waitForPage();
      appSummary.cardDeployInfo.github.waitUntilShown();
      appSummary.cardDeployInfo.github.getValue().then(commitHash => {
        expect(commitHash).toBeDefined();
        expect(commitHash.length).toBe(8);
      });

      browser.waitForAngularEnabled(true);
    });
  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
