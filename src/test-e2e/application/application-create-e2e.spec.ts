import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationsPage } from '../applications/applications.po';
import { StepperComponent } from '../po/stepper.po';
import { browser } from 'protractor';
import { CreateApplicationStepper } from './create-application-stepper.po';
import { E2eScreenshot } from '../helpers/screenshots-helper';


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

    // Go to app name step
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.wait(createAppStepper.next());

    // Enter app name
    createAppStepper.setAppName(testAppName);

    // Go to route step
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.wait(createAppStepper.next());

    // Check route details are autopopulated correctly, then correct (remove disallowed punctuation)
    createAppStepper.isRouteHostValue(testAppName);
    browser.wait(createAppStepper.fixRouteHost(testAppName));

    // Finish stepper
    expect(createAppStepper.canNext()).toBeTruthy();
    browser.sleep(5000);
    browser.wait(createAppStepper.next());

    browser.sleep(20000);
    appWall.header.getTitleText().then(text => console.log('title', text));
    // Expect page to become app wall
    appWall.waitFor();

    // Expect new app to be in app list
    expect(appWall.appList.cards.getCard(1).getTitle()).toBe(testAppName);
  });

  afterEach(function () {
    const promise = applicationE2eHelper.cfRequestHelper.getCfCnsi().then(cnsi => {
      // return browser.driver.wait(applicationE2eHelper.deleteApplicationByName(cnsi.guid, testAppName));
    });
    return browser.driver.wait(promise);
  });

});
