import { browser } from 'protractor';

import { IApp } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationBasePage } from './po/application-page.po';
import { CreateApplicationStepper } from './po/create-application-stepper.po';

describe('Application Create', function () {

  let nav: SideNavigation;
  let appWall: ApplicationsPage;
  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid, app: APIResource<IApp>;

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
  beforeAll(() => applicationE2eHelper.cfHelper.updateDefaultCfOrgSpace());

  beforeEach(() => nav.goto(SideNavMenuItem.Applications));

  it('Should create app', () => {
    const testTime = (new Date()).toISOString();
    const testAppName = ApplicationE2eHelper.createApplicationName(testTime);

    // Press '+' button
    appWall.clickCreateApp();
    const createAppStepper = new CreateApplicationStepper();
    createAppStepper.waitUntilShown();

    // Expect cf step
    createAppStepper.waitForStepCloudFoundry();

    // Enter cf, org + space
    createAppStepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    createAppStepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    createAppStepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);

    // Go to app name step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.waitForStepName();

    // Enter app name
    createAppStepper.setAppName(testAppName);

    // Go to route step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.waitForStepRoute();

    // Check route details is auto-populated correctly, then correct (remove disallowed punctuation)
    createAppStepper.isRouteHostValue(testAppName);
    createAppStepper.fixRouteHost(testAppName);

    // Finish stepper
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();

    // Wait for the stepper to exit
    createAppStepper.waitUntilNotShown();

    // Determine the app guid and confirm we're on the app summary page
    browser.wait(applicationE2eHelper.fetchAppInDefaultOrgSpace(testAppName).then((res) => {
      expect(res.app).not.toBe(null);
      app = res.app;
      cfGuid = res.cfGuid;
      const appSummaryPage = new ApplicationBasePage(res.cfGuid, app.metadata.guid);
      appSummaryPage.waitForPage();
    }));

  });

  afterAll(() => {
    expect(cfGuid).toBeDefined();
    expect(cfGuid).not.toBeNull();
    expect(app).toBeDefined();
    expect(app).not.toBeNull();
    return app ? applicationE2eHelper.deleteApplication({ cfGuid, app }) : null;
  });

});
