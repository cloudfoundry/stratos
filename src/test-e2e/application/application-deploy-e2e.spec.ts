import { browser, promise, protractor } from 'protractor';

import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationSummary } from './application-summary.po';


const until = protractor.ExpectedConditions;

let nav: SideNavigation;
let appWall: ApplicationsPage;
let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

const cfName = e2e.secrets.getDefaultCFEndpoint().name;
const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

const appName = 'cf-quick-app';

describe('Application Deploy', function () {

  const testApp = e2e.secrets.getDefaultCFEndpoint().testDeployApp || 'nwmac/cf-quick-app';

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

  beforeEach(() => nav.goto(SideNavMenuItem.Applications));

  it('Should deploy app from GitHub', () => {
    expect(appWall.isActivePage()).toBeTruthy();

    // Should be on deploy app modal
    const deployApp = appWall.clickDeployApp();
    expect(deployApp.header.getTitleText()).toBe('Deploy');

    // Check the steps
    deployApp.stepper.getStepNames().then(steps => {
      expect(steps.length).toBe(4);
      expect(steps[0]).toBe('Cloud Foundry');
      expect(steps[1]).toBe('Source');
      expect(steps[2]).toBe('Source Config');
      expect(steps[3]).toBe('Deploy');
    });
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

    expect(deployApp.stepper.getActiveStepName()).toBe('Source');
    expect(deployApp.stepper.canNext()).toBeFalsy();
    deployApp.stepper.getStepperForm().fill({ 'projectname': testApp });

    deployApp.stepper.waitUntilCanNext('Next');
    deployApp.stepper.next();
    expect(deployApp.stepper.getActiveStepName()).toBe('Source Config');

    const commits = deployApp.getCommitList();
    expect(commits.getHeaderText()).toBe('Select a commit');

    expect(deployApp.stepper.canNext()).toBeFalsy();

    commits.getTableData().then(data => {
      expect(data.length).toBeGreaterThan(0);
      expect(deployApp.stepper.canNext()).toBeFalsy();

      commits.selectRow(0);
      expect(deployApp.stepper.canNext()).toBeTruthy();

      // Turn off waiting for Angular - the web socket connection is kept open which means the tests will timeout
      // waiting for angular if we don't turn off.
      browser.waitForAngularEnabled(false);

      // Press next to deploy the app
      deployApp.stepper.next();

      // Wait until app summary button can be pressed
      deployApp.stepper.waitUntilCanNext('Go to App Summary');

      // Click next
      deployApp.stepper.next();

      // Should be app summary
      browser.wait(ApplicationSummary.detect()
        .then(appSummary => {
          appSummary.waitForPage();
          appSummary.header.waitForTitleText(appName);
          return appSummary.cfGuid;
        })
        .then(cfGuid => applicationE2eHelper.deleteApplication(null, { appName })));
    });

  });

});
