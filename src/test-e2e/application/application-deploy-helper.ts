import { browser, promise } from 'protractor';

import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { CFPage } from '../po/cf-page.po';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationBasePage } from './po/application-page.po';
import { DeployApplication } from './po/deploy-app.po';

export enum CREATE_APP_DEPLOY_TEST_TYPE {
  GIT_CLONE = 'GitHub',
  GIT_URL = 'Git URL',
  DOCKER = 'Docker Image',
}

export function createApplicationDeployTests(type = CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE): {
  testApp: string,
  testAppName: string,
  deployedCommit: promise.Promise<string>,
  appDetails: {
    cfGuid: string,
    appGuid: string
  },
  dockerUrl: string
} {
  const res = {
    testApp: e2e.secrets.getDefaultCFEndpoint().testDeployApp || 'nwmac/cf-quick-app',
    testAppName: ApplicationE2eHelper.createApplicationName(),
    deployedCommit: null,
    appDetails: {
      cfGuid: '',
      appGuid
        : ''
    },
    dockerUrl: 'nginxdemos/hello'
  };
  const testAppUrl = 'https://github.com/' + res.testApp;
  const sourceText = type.toString(); // appUrl ? 'Git URL' : 'GitHub';

  const cfName = e2e.secrets.getDefaultCFEndpoint().name;
  const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
  const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;


  const nav = new SideNavigation();
  const appWall = new ApplicationsPage();

  beforeAll(() => nav.goto(SideNavMenuItem.Applications));

  // Might take a bit longer to deploy the app than the global default timeout allows
  extendE2ETestTime(120000);

  describe(`Should deploy app from ${sourceText}`, () => {

    const loggingPrefix = `Application Deploy: Deploy from ${sourceText}:`;
    let deployApp: DeployApplication;

    beforeAll(() => {
      // Should move to deploy app modal
      expect(appWall.isActivePage()).toBeTruthy();
      appWall.waitForPage();
      const baseCreateAppStep = appWall.clickCreateApp();
      baseCreateAppStep.waitForPage();
      switch (type) {
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE:
          deployApp = baseCreateAppStep.selectDeploy();
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_URL:
          deployApp = baseCreateAppStep.selectDeployUrl();
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.DOCKER:
          deployApp = baseCreateAppStep.selectDeployDocker();
          break;
      }

    });

    it('Check deploy steps', () => {
      switch (type) {
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE:
          expect(deployApp.header.getTitleText()).toBe(`Deploy from Public ${sourceText}`);
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_URL:
          expect(deployApp.header.getTitleText()).toBe(`Deploy from Public ${sourceText}`);
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.DOCKER:
          expect(deployApp.header.getTitleText()).toBe(`Deploy from Docker Image`);

          break;
      }

      // Check the steps
      e2e.debugLog(`${loggingPrefix} Checking Steps`);
      deployApp.stepper.getStepNames().then(steps => {
        switch (type) {
          case CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE:
            expect(steps.length).toBe(5);
            expect(steps[0]).toBe('Cloud Foundry');
            expect(steps[1]).toBe('Source');
            expect(steps[2]).toBe('Source Config');
            expect(steps[3]).toBe('Overrides (Optional)');
            expect(steps[4]).toBe('Deploy');
            break;
          case CREATE_APP_DEPLOY_TEST_TYPE.GIT_URL:
            expect(steps.length).toBe(4);
            expect(steps[0]).toBe('Cloud Foundry');
            expect(steps[1]).toBe('Source');
            expect(steps[2]).toBe('Overrides (Optional)');
            expect(steps[3]).toBe('Deploy');
            break;
          case CREATE_APP_DEPLOY_TEST_TYPE.DOCKER:
            expect(steps.length).toBe(4);
            expect(steps[0]).toBe('Cloud Foundry');
            expect(steps[1]).toBe('Source');
            expect(steps[2]).toBe('Overrides (Optional)');
            expect(steps[3]).toBe('Deploy');
            break;
        }
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

      switch (type) {
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE:
          deployApp.stepper.getStepperForm().fill({ projectname: res.testApp });
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.GIT_URL:
          deployApp.stepper.getStepperForm().fill({ giturl: testAppUrl });
          deployApp.stepper.getStepperForm().fill({ urlbranchname: 'master' });
          break;
        case CREATE_APP_DEPLOY_TEST_TYPE.DOCKER:
          deployApp.stepper.getStepperForm().fill({ dockerappname: res.testAppName });
          deployApp.stepper.getStepperForm().fill({ dockerimg: res.dockerUrl });
          break;
      }


      // Press next to get to source config step
      deployApp.stepper.waitUntilCanNext('Next');
      deployApp.stepper.next();
    });

    it('Should pass Source Config step', () => {
      if (type !== CREATE_APP_DEPLOY_TEST_TYPE.GIT_CLONE) {
        // Skip
        return;
      }

      e2e.debugLog(`${loggingPrefix} Source Config Step`);
      expect(deployApp.stepper.getActiveStepName()).toBe('Source Config');
      const commits = deployApp.getCommitList();
      expect(commits.getHeaderText()).toBe('Select a commit');

      // The first commit should be auto-selected
      expect(deployApp.stepper.canNext()).toBeTruthy();

      commits.getTableData().then(data => {
        expect(data.length).toBeGreaterThan(0);
      });

      commits.selectRow(0);
      e2e.debugLog(`${loggingPrefix} Select a commit (selected)`);

      res.deployedCommit = commits.getCell(0, 2).getText();
      expect(deployApp.stepper.canNext()).toBeTruthy();

      // Press next to get to overrides step
      deployApp.stepper.next();
    });


    it('Should pass Overrides step', () => {
      e2e.debugLog(`${loggingPrefix} Overrides Step`);
      expect(deployApp.stepper.canNext()).toBeTruthy();

      const overrides = deployApp.getOverridesForm();
      overrides.waitUntilShown();

      // Adding a random route appends to the app name... which bumps route over 63 character max
      if (type !== CREATE_APP_DEPLOY_TEST_TYPE.DOCKER) {
        overrides.fill({ name: res.testAppName });
      }

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
      appSummaryPage.header.waitForTitleText(res.testAppName);
      browser.wait(ApplicationBasePage.detect()
        .then(appSummary => {
          res.appDetails.cfGuid = appSummary.cfGuid;
          res.appDetails.appGuid = appSummary.appGuid;
        }), 10000, 'Failed to wait for Application Summary page after deploying application'
      );
    });
  });

  return res;
}
