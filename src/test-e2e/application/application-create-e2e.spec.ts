import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationsPage } from '../applications/applications.po';
import { StepperComponent } from '../po/stepper.po';
import { browser } from 'protractor';
import { CreateApplicationStepper } from './create-application-stepper.po';
import { E2eScreenshot } from '../helpers/screenshots-helper';
import { ApplicationSummary } from './application-summary.po';


fdescribe('Application Create', function () {

  let nav: SideNavigation;
  let appWall: ApplicationsPage;
  let applicationE2eHelper: ApplicationE2eHelper;

  beforeAll(() => {
    nav = new SideNavigation();
    appWall = new ApplicationsPage();
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
  });

  beforeEach(() => {
    nav.goto(SideNavMenuItem.Applications);
  });

  let testAppName, cfGuid;

  it('Should create app', () => {
    const testTime = (new Date()).toISOString();
    testAppName = ApplicationE2eHelper.createApplicationName(testTime);

    // Press '+' button
    appWall.clickCreateApp();
    const createAppStepper = new CreateApplicationStepper();
    createAppStepper.waitUntilShown();

    // Expect cf step
    createAppStepper.isStepCloudFoundry();

    // Enter cf, org + space
    createAppStepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    createAppStepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    createAppStepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);

    // Go to app name step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.isStepName();

    // Enter app name
    createAppStepper.setAppName(testAppName);

    // Go to route step
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();
    createAppStepper.isStepRoute();

    // Check route details is auto-populated correctly, then correct (remove disallowed punctuation)
    createAppStepper.isRouteHostValue(testAppName);
    createAppStepper.fixRouteHost(testAppName);

    // Finish stepper
    expect(createAppStepper.canNext()).toBeTruthy();
    createAppStepper.next();

    const getCfCnsi = applicationE2eHelper.cfRequestHelper.getCfCnsi();

    const fetchApp = getCfCnsi.then(endpointModel => {
      console.log('1 ', endpointModel);
      this.cfGuid = endpointModel.guid;
      return applicationE2eHelper.fetchApp(this.cfGuid, testAppName);
    });

    const appFetched = fetchApp.then(response => {
      console.log('2', response);
      expect(response.total_results).toBe(1);
      const app = response.resources[0];

      const appSummaryPage = new ApplicationSummary(this.cfGuid, app.metadata.guid, app.entity.name);
      appSummaryPage.waitFor();
    });
  });

  afterEach(function () {
    // return browser.driver.wait(applicationE2eHelper.deleteApplicationByName(cnsi.guid, testAppName));


    // const promise = applicationE2eHelper.cfRequestHelper.getCfCnsi().then(cnsi => {
    //   // return browser.driver.wait(applicationE2eHelper.deleteApplicationByName(cnsi.guid, testAppName));
    // });
    // return browser.driver.wait(promise);
  });

});
