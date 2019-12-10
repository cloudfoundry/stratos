import { browser } from 'protractor';

import { IApp } from '../../frontend/packages/core/src/core/cf-api.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationBasePage } from './po/application-page.po';

describe('Application Create', () => {

  let nav: SideNavigation;
  let appWall: ApplicationsPage;
  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid;
  let testAppName;
  let app: APIResource<IApp>;
  let createAppStepper;

  beforeAll(() => {
    nav = new SideNavigation();
    appWall = new ApplicationsPage();
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
    applicationE2eHelper = new ApplicationE2eHelper(setup);
  });

  // Fetch the default cf, org and space up front. This saves time later
  it('Fetching Default Values', done =>
    applicationE2eHelper.cfHelper.updateDefaultCfOrgSpace().then(done).catch(a => console.log('1:', a))
  );

  it('Should reach applications tab', () => nav.goto(SideNavMenuItem.Applications).catch(a => console.log('2:', a)));

  it('Should create app', () => {
    const testTime = (new Date()).toISOString();
    testAppName = ApplicationE2eHelper.createApplicationName(testTime);

    e2e.debugLog('a');

    // Press '+' button
    const baseCreateAppStep = appWall.clickCreateApp();
    baseCreateAppStep.waitForPage();
    createAppStepper = baseCreateAppStep.selectShell();
    createAppStepper.waitUntilShown();

    e2e.debugLog('b');

  });

  it('Should create app', () => {
    // Expect cf step
    createAppStepper.waitForStepCloudFoundry();

    e2e.debugLog('1');

    // Enter cf, org + space
    createAppStepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    createAppStepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    createAppStepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);

    e2e.debugLog('2');

    // Go to app name step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.waitForStepName();

    e2e.debugLog('3');

    // Enter app name
    createAppStepper.setAppName(testAppName);
    e2e.debugLog('4');

    // Go to route step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.waitForStepRoute();

    e2e.debugLog('5');

    // Check route details is auto-populated correctly, then correct (remove disallowed punctuation)
    createAppStepper.isRouteHostValue(testAppName);
    createAppStepper.fixRouteHost(testAppName);

    e2e.debugLog('6');

    // Finish stepper
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();

    e2e.debugLog('7');
  });

  it('Should close stepper', () => {
    // Wait for the stepper to exit
    createAppStepper.waitUntilNotShown();
  });

  it('Should reach application summary page', () => {
    // Determine the app guid and confirm we're on the app summary page
    browser.wait(
      applicationE2eHelper.fetchAppInDefaultOrgSpace(testAppName).then((res) => {
        expect(res.app).not.toBe(null);
        // Need these later on, so wait is important
        app = res.app;
        cfGuid = res.cfGuid;
        const appSummaryPage = new ApplicationBasePage(res.cfGuid, app.metadata.guid);
        appSummaryPage.waitForPage();
      })
    );

  });

  afterAll(() => {
    expect(cfGuid).toBeDefined();
    expect(cfGuid).not.toBeNull();
    expect(app).toBeDefined();
    expect(app).not.toBeNull();
    return app ? applicationE2eHelper.deleteApplication({ cfGuid, app }) : null;
  });

});
