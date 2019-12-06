import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { extendE2ETestTime } from '../helpers/extend-test-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationBasePage } from './po/application-page.po';


describe('Application Delete', () => {

  let nav: SideNavigation;
  let appWall: ApplicationsPage;
  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid: string;
  let app;
  let testAppName: string;

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
  });

  beforeEach(() => nav.goto(SideNavMenuItem.Applications));

  // Delete tests for a simple app with no routes
  describe('Simple App', () => {
    beforeAll(() => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();
      const endpointName = defaultCf.name;
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, endpointName);
      const testTime = (new Date()).toISOString();
      testAppName = ApplicationE2eHelper.createApplicationName(testTime);
      return applicationE2eHelper.createApp(
        cfGuid,
        e2e.secrets.getDefaultCFEndpoint().testOrg,
        e2e.secrets.getDefaultCFEndpoint().testSpace,
        testAppName,
        defaultCf
      ).then(appl => app = appl);
    });

    afterAll(() => {
      if (app) {
        applicationE2eHelper.deleteApplication({ cfGuid, app });
      }
    });

    it('Should return to summary page after cancel', () => {
      const appSummaryPage = new ApplicationBasePage(cfGuid, app.metadata.guid);
      appSummaryPage.navigateTo();
      appSummaryPage.waitForPage(40000);
      // Open delete app dialog
      const deleteApp = appSummaryPage.delete();
      // App did not have a route, so there should be no routes step
      expect(deleteApp.hasRouteStep()).toBeFalsy();
      // 1 step - np header shown
      expect(deleteApp.stepper.canCancel()).toBeTruthy();
      expect(deleteApp.stepper.canNext()).toBeTruthy();
      expect(deleteApp.stepper.hasPrevious()).toBeFalsy();

      deleteApp.stepper.cancel();
      appSummaryPage.waitForPage();
    });

    describe('Long running tests', () => {
      const timeout = 120000;
      extendE2ETestTime(timeout);

      beforeAll(() => {
        expect(app).toBeDefined();
        expect(testAppName).toBeDefined();
      });

      it('Should delete app', () => {
        // We should be on the app wall
        expect(appWall.isActivePage()).toBeTruthy();

        // We created the app after the wall loaded, so refresh to make sure app wall shows the new app
        appWall.appList.header.refresh();

        appWall.appList.header.setSearchText(testAppName);
        expect(appWall.appList.getTotalResults()).toBe(1, 'Failed to find app that we should test delete on');

        // Open delete app dialog
        const appSummaryPage = new ApplicationBasePage(cfGuid, app.metadata.guid);
        appSummaryPage.navigateTo();
        appSummaryPage.waitForPage();
        const deleteApp = appSummaryPage.delete();

        // App did not have a route, so there should be no routes step
        expect(deleteApp.hasRouteStep()).toBeFalsy();

        // 1 step - np header shown
        expect(deleteApp.stepper.canCancel()).toBeTruthy();
        expect(deleteApp.stepper.canNext()).toBeTruthy();
        expect(deleteApp.stepper.hasPrevious()).toBeFalsy();

        deleteApp.table.getTableData().then(table => {
          expect(table.length).toBe(1);
          expect(table[0].name).toBe(testAppName);
          expect(table[0].instances).toBe('0 / 1');
        });

        expect(deleteApp.stepper.getNextLabel()).toBe('Delete');

        // Delete the app
        deleteApp.stepper.next();

        deleteApp.stepper.waitUntilCanNext();
        expect(deleteApp.stepper.getNextLabel()).toBe('Close');
        // Close
        deleteApp.stepper.next();

        // Should go back to app wall
        appWall.waitForPage();

        appWall.appList.header.waitUntilShown();

        // We deleted the app, so don't try and do this on cleanup
        app = null;

        appWall.appList.header.setSearchText(testAppName);
        expect(appWall.appList.getTotalResults()).toBe(0);
      }, timeout);
    });


  });

});
