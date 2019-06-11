import { browser, promise } from 'protractor';

import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { CFPage } from '../po/cf-page.po';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageAutoscalerTab } from './po/application-page-autoscaler.po';
import { ApplicationPageVariablesTab } from './po/application-page-variables.po';
import { ApplicationBasePage } from './po/application-page.po';

let nav: SideNavigation;
let appWall: ApplicationsPage;
let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

const cfName = e2e.secrets.getDefaultCFEndpoint().name;
const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

describe('Autoscaler -', () => {

  const testApp = e2e.secrets.getDefaultCFEndpoint().testDeployApp || 'nwmac/cf-quick-app';
  const testAppUrl = 'https://github.com/' + testApp;
  const testAppName = ApplicationE2eHelper.createApplicationName();
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
    describe('Should deploy app from Git URL', () => {

      const loggingPrefix = 'Application Deploy: Deploy from Git URL:';
      let deployApp;

      beforeAll(() => {
        // Should be on deploy app modal
        expect(appWall.isActivePage()).toBeTruthy();
        appWall.waitForPage();
        const baseCreateAppStep = appWall.clickCreateApp();
        baseCreateAppStep.waitForPage();
        deployApp = baseCreateAppStep.selectDeployUrl();
      });

      it('Check edit steps', () => {
        expect(deployApp.header.getTitleText()).toBe('Deploy from Public Git URL');
        // Check the steps
        e2e.debugLog(`${loggingPrefix} Checking Steps`);
        deployApp.stepper.getStepNames().then(steps => {
          expect(steps.length).toBe(4);
          expect(steps[0]).toBe('Cloud Foundry');
          expect(steps[1]).toBe('Source');
          expect(steps[2]).toBe('Overrides (Optional)');
          expect(steps[3]).toBe('Deploy');
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
        deployApp.stepper.getStepperForm().fill({ cf: cfName });
        deployApp.stepper.getStepperForm().fill({ org: orgName });
        deployApp.stepper.getStepperForm().fill({ space: spaceName });
        expect(deployApp.stepper.canNext()).toBeTruthy();

        // Press next to get to source step
        deployApp.stepper.next();
      });

      it('Should pass Source step', () => {
        e2e.debugLog(`${loggingPrefix} Source Step`);
        expect(deployApp.stepper.getActiveStepName()).toBe('Source');
        expect(deployApp.stepper.canNext()).toBeFalsy();
        deployApp.stepper.getStepperForm().fill({ giturl: testAppUrl });
        deployApp.stepper.getStepperForm().fill({ urlbranchname: 'master' });

        // Press next to get to source config step
        deployApp.stepper.waitUntilCanNext('Next');
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
  });

  it('Autoscale Tab -- Disabled', () => {
    // Does app to be fully started
    const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
    appAutoscaler.goToAutoscalerTab();
    appAutoscaler.cardInstances.waitForRunningInstancesText('1 / 1');
    expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('false');
    expect(appAutoscaler.cardStatus.getStatusText()).toBe('Disabled');
    expect(appAutoscaler.tableEvents.getEmptyTableWarningText()).toBe('No events.');
  });

  describe('Autoscaler Attach Policy', () => {
    const loggingPrefix = 'Edit AutoScaler Policy:';
    let createPolicy;

    beforeAll(() => {
      const appAutoscaler = new ApplicationPageAutoscalerTab(appDetails.cfGuid, appDetails.appGuid);
      appAutoscaler.goToAutoscalerTab();
      createPolicy = appAutoscaler.cardStatus.clickAttachPolicy();
    });

    it('Check deploy steps', () => {
      expect(createPolicy.header.getTitleText()).toBe('Edit AutoScaler Policy: ' + testAppName);
      // Check the steps
      e2e.debugLog(`${loggingPrefix} Checking Steps`);
      createPolicy.stepper.getStepNames().then(steps => {
        expect(steps.length).toBe(4);
        expect(steps[0]).toBe('Default Instance Limits');
        expect(steps[1]).toBe('Scaling Rules');
        expect(steps[2]).toBe('Recurring Schedules');
        expect(steps[3]).toBe('Specific Dates');
      });
    });

    it('Should pass DefaultInstanceLimits Step', () => {
      e2e.debugLog(`${loggingPrefix} DefaultInstanceLimits Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Default Instance Limits');
      // Fill in form
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '1' });
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '8' });
      createPolicy.stepper.getStepperForm().fill({ timezone: 'UTC' });
      expect(createPolicy.stepper.canNext()).toBeTruthy();
      // Press next to get to source step
      createPolicy.stepper.next();
    });

    it('Should pass ScalingRules Step', () => {
      e2e.debugLog(`${loggingPrefix} ScalingRules Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Scaling Rules');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ metric_type: 'memoryutil' });
      createPolicy.stepper.getStepperForm().fill({ operator: '>=' });
      createPolicy.stepper.getStepperForm().fill({ threshold: '20' });
      createPolicy.stepper.getStepperForm().fill({ breach_duration_secs: '60' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '10' });
      createPolicy.stepper.getStepperForm().fill({ cool_down_secs: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(2);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe('true');
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '2' });
      createPolicy.stepper.getStepperForm().fill({ cool_down_secs: '60' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      createPolicy.stepper.getStepperForm().fill({ metric_type: 'throughput' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      // Fill in form -- invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment: '10' });
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(1);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe('true');
      // Fill in form -- fix invalid inputs
      createPolicy.stepper.getStepperForm().fill({ adjustment_type: '% instances' });
      createPolicy.stepper.getStepperForm().fill({ adjustment: '10' }); // todo
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      createPolicy.stepper.clickDoneButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(3);
      // Click [Delete] button
      createPolicy.stepper.clickDeleteButton(2);
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(2);

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should pass RecurringSchedules Step', () => {
      e2e.debugLog(`${loggingPrefix} RecurringSchedules Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Recurring Schedules');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      // createPolicy.stepper.getStepperForm().fill({ effective_type: 'custom' });
      // createPolicy.stepper.getStepperForm().fill({ start_date: '2100/01/01' });
      // createPolicy.stepper.getStepperForm().fill({ end_date: '2101/01/01' });
      // createPolicy.stepper.getStepperForm().fill({ repeat_type: 'month' });
      // createPolicy.stepper.getStepperForm().fill({ days_of_month: ['2', '3'] });
      // createPolicy.stepper.getStepperForm().fill({ start_time: '08:00AM'});
      // createPolicy.stepper.getStepperForm().fill({ end_time: '08:00PM'});
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2'});
      createPolicy.stepper.getStepperForm().fill({ initial_min_instance_count: '5'});
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '10'});
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should pass SpecificDates Step', () => {
      e2e.debugLog(`${loggingPrefix} SpecificDates Step`);
      expect(createPolicy.stepper.getActiveStepName()).toBe('Specific Dates');
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(0);

      // Click [Add] button
      createPolicy.stepper.clickAddButton();
      expect(createPolicy.stepper.getRuleTilesCount()).toBe(1);
      expect(createPolicy.stepper.canNext()).toBeFalsy();
      // Fill in form -- valid inputs
      // createPolicy.stepper.getStepperForm().fill({ start_date_time: '2098/01/01,08:00AM' });
      // createPolicy.stepper.getStepperForm().fill({ end_date_time: '2099/01/01,08:00PM' });
      createPolicy.stepper.getStepperForm().fill({ instance_min_count: '2'});
      createPolicy.stepper.getStepperForm().fill({ initial_min_instance_count: '5'});
      createPolicy.stepper.getStepperForm().fill({ instance_max_count: '10'});
      expect(createPolicy.stepper.getMatErrorsCount()).toBe(0);
      expect(createPolicy.stepper.getDoneButtonDisabledStatus()).toBe(null);
      createPolicy.stepper.clickDoneButton();

      expect(createPolicy.stepper.canNext()).toBeTruthy();
      createPolicy.stepper.next();
    });

    it('Should go to App Autoscaler Tab', () => {
      e2e.sleep(1000);
      e2e.debugLog(`${loggingPrefix} Waiting For App Autoscaler Tab`);
      // Should be app autoscaler tab
      const appSummaryPage = new CFPage('/applications/');
      appSummaryPage.waitForPageOrChildPage();
      appSummaryPage.header.waitForTitleText(testAppName);
      browser.wait(ApplicationPageAutoscalerTab.detect()
        .then(appAutoscaler => {
          appDetails.cfGuid = appAutoscaler.cfGuid;
          appDetails.appGuid = appAutoscaler.appGuid;
          expect(appAutoscaler.cardStatus.getStatusToggleInput()).toBe('true');
          expect(appAutoscaler.cardStatus.getStatusText()).toBe('Enabled');
        }), 10000, 'Failed to wait for App Autoscaler Tab after attach policy'
      );
    });
  });

  afterAll(() => applicationE2eHelper.deleteApplication(null, { appName: testAppName }));

});
