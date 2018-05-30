import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationsPage } from '../applications/applications.po';
import { StepperComponent } from '../po/stepper.po';
import { browser } from 'protractor';
import { CreateApplicationStepper } from './create-application-stepper.po';


fdescribe('Application Create', function () {

  const nav = new SideNavigation();
  const appWall = new ApplicationsPage();
  let applicationE2eHelper: ApplicationE2eHelper;
  // let dDefaultCFEndpoint;

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user);
    setup
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
  });

  beforeEach(() => {
    nav.goto(SideNavMenuItem.Applications);
  });

  let testAppName;

  it('Should create app', () => {
    const testTime = (new Date()).toISOString();
    testAppName = ApplicationE2eHelper.createApplicationName(testTime);

    // Press '+' button
    appWall.clickCreateApp();
    const createAppStepper = new CreateApplicationStepper();
    createAppStepper.waitUntilShown();
    // Expect cf step
    createAppStepper.isStep('Cloud Foundry');
    // Enter cf, org + space
    createAppStepper.setCf(e2e.secrets.getDefaultCFEndpoint().name);
    createAppStepper.setOrg(e2e.secrets.getDefaultCFEndpoint().testOrg);
    createAppStepper.setSpace(e2e.secrets.getDefaultCFEndpoint().testSpace);
    //// browser.sleep(20000);
    // Go to app name step
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.wait(createAppStepper.next());
    // browser.sleep(5000);
    // Enter app name
    createAppStepper.setAppName(testAppName);
    browser.sleep(5000);
    // Go to route step
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.wait(createAppStepper.next());
    browser.sleep(5000);
    // Check route details
    createAppStepper.isRouteHostValue(testAppName);
    // Finish stepper
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.wait(createAppStepper.next());
    browser.sleep(10000);

    // Expect page to be app wall
    // Expect new app to be in app list
  });

  afterAll(function () {
    return applicationE2eHelper.cfRequestHelper.getCfCnsi().then(cnsi => {
      // return applicationE2eHelper.deleteApplicationByName(cnsi.guid, testAppName);
    });
  });

});
