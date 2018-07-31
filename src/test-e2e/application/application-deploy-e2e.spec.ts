import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationSummary } from './application-summary.po';
import { CreateApplicationStepper } from './create-application-stepper.po';
import { CFHelpers } from '../helpers/cf-helpers';
import { ExpectedConditions, browser } from 'protractor';

let nav: SideNavigation;
let appWall: ApplicationsPage;
let applicationE2eHelper: ApplicationE2eHelper;
let cfHelper: CFHelpers;

const orgName = e2e.secrets.getDefaultCFEndpoint().testOrg;
const spaceName = e2e.secrets.getDefaultCFEndpoint().testSpace;

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
    expect(deployApp.stepper.canNext()).toBeFalsy();

    // Fill in form
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
      ApplicationSummary.detect().then(appSummary => {
        appSummary.waitForPage();
        expect(appSummary.getAppName()).toBe('cf-quick-app');
        applicationE2eHelper.cfHelper.deleteApp(appSummary.cfGuid, appSummary.appGuid);
      });
    });

  });



});
