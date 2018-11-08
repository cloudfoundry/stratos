import { promise, protractor } from 'protractor';

import { IApp } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageEventsTab } from './po/application-page-events.po';
import { ApplicationPageInstancesTab } from './po/application-page-instances.po';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { ApplicationPageSummaryTab } from './po/application-page-summary.po';
import { ApplicationPageVariablesTab } from './po/application-page-variables.po';

describe('Application View -', function () {
  let cfHelper: CFHelpers;
  let applicationE2eHelper: ApplicationE2eHelper;
  const appName = ApplicationE2eHelper.createApplicationName();
  let app: APIResource<IApp>;
  let appSummary: ApplicationPageSummaryTab;
  let defaultStack = '';

  function createTestAppAndNav(): promise.Promise<any> {
    return cfHelper.basicCreateApp(
      CFHelpers.cachedDefaultCfGuid,
      CFHelpers.cachedDefaultSpaceGuid,
      appName
    )
      .then(pApp => app = pApp)
      .then(() => {
        appSummary = new ApplicationPageSummaryTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
        appSummary.navigateTo();
        appSummary.waitForPage();
      });
  }

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin);
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    cfHelper = applicationE2eHelper.cfHelper;

    protractor.promise.controlFlow().execute(() => cfHelper.updateDefaultCfOrgSpace());
    protractor.promise.controlFlow().execute(() => createTestAppAndNav());
  });

  beforeAll(() => {
    return cfHelper.fetchDefaultStack(e2e.secrets.getDefaultCFEndpoint()).then(stack => defaultStack = stack);
  });

  afterAll(() => {
    if (app) {
      return applicationE2eHelper.deleteApplication(null, { appGuid: app.metadata.guid }, false);
    }
  });

  describe('Breadcrumbs', () => {

    function testApplicationsBreadcrumb() {
      appSummary.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Applications');
      });
    }

    it('Fresh load', testApplicationsBreadcrumb);

    it('From App Wall', () => {
      const appWall = new ApplicationsPage();
      appWall.navigateTo();
      appWall.waitForPage();
      appSummary.navigateTo();
      appSummary.waitForPage();
      testApplicationsBreadcrumb();
    });
  });


  it('Walk tabs', () => {
    appSummary.navigateTo();

    appSummary.goToInstancesTab();
    appSummary.goToRoutesTab();
    appSummary.goToLogStreamTab();
    appSummary.goToServicesTab();
    appSummary.goToVariablesTab();
    appSummary.goToEventsTab();
    appSummary.goToSummaryTab();
  });

  describe('Summary Tab -', () => {
    beforeAll(() => {
      appSummary.navigateTo();
      appSummary.waitForPage();
    });

    it('Status', () => {
      appSummary.cardStatus.waitForStatus('Incomplete');
    });

    it('Instances', () => {
      appSummary.cardInstances.waitForRunningInstancesText('0 / 1');
    });

    it('App Running', () => {
      appSummary.cardUptime.waitForTitle('Application is not running');
    });

    it('Info', () => {
      expect(appSummary.cardInfo.memQuota.getValue()).toBe('23 MB');
      expect(appSummary.cardInfo.diskQuota.getValue()).toBe('35 MB');
      expect(appSummary.cardInfo.appState.getValue()).toBe('STOPPED');
      expect(appSummary.cardInfo.packageState.getValue()).toBe('PENDING');
      expect(appSummary.cardInfo.services.getValue()).toBe('0');
      expect(appSummary.cardInfo.routes.getValue()).toBe('0');
    });

    it('Cf', () => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();

      expect(appSummary.cardCfInfo.cf.getValue()).toBe(defaultCf.name);
      expect(appSummary.cardCfInfo.org.getValue()).toBe(defaultCf.testOrg);
      expect(appSummary.cardCfInfo.space.getValue()).toBe(defaultCf.testSpace);
    });

    it('Build Info', () => {
      expect(appSummary.cardBuildInfo.buildPack.getValue()).toBe('-');
      expect(appSummary.cardBuildInfo.stack.getValue()).toBe(defaultStack);
    });

    it('Deployment Info', () => {
      appSummary.cardDeployInfo.waitForTitle('No Deployment Info');
    });
  });

  describe('Instances Tab -', () => {
    let appInstances: ApplicationPageInstancesTab;

    beforeAll(() => {
      appInstances = new ApplicationPageInstancesTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
      appInstances.navigateTo();
      appInstances.waitForPage();
    });

    it('Status', () => {
      appInstances.cardStatus.waitForStatus('Incomplete');
    });

    it('Instances', () => {
      appInstances.cardInstances.waitForRunningInstancesText('0 / 1');
    });

    it('App Running', () => {
      appInstances.cardUsage.waitForTitle('Application is not running');
    });

    it('Empty Instances Table', () => {
      expect(appInstances.list.empty.getDefault().isDisplayed()).toBeTruthy();
      expect(appInstances.list.empty.getDefault().getComponent().getText()).toBe('There are no application instances');
    });

  });

  describe('Routes Tab -', () => {
    let appRoutes: ApplicationPageRoutesTab;

    beforeAll(() => {
      appRoutes = new ApplicationPageRoutesTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
      appRoutes.navigateTo();
      appRoutes.waitForPage();
    });

    it('Empty Routes Table', () => {
      expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getCustom().getComponent().isDisplayed()).toBeTruthy();
      expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');
    });

  });

  describe('Variables Tab -', () => {
    let appVariables: ApplicationPageVariablesTab;

    beforeAll(() => {
      appVariables = new ApplicationPageVariablesTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
      appVariables.navigateTo();
      appVariables.waitForPage();
    });

    it('Empty Variables Table', () => {
      expect(appVariables.list.empty.getDefault().isPresent()).toBeTruthy();
      expect(appVariables.list.empty.getDefault().getComponent().getText()).toBe('There are no variables');
    });

  });

  describe('Events Tab -', () => {
    let appEvents: ApplicationPageEventsTab;

    beforeAll(() => {
      appEvents = new ApplicationPageEventsTab(CFHelpers.cachedDefaultCfGuid, app.metadata.guid);
      appEvents.navigateTo();
      appEvents.waitForPage();
    });

    it('One row in events table', () => {
      expect(appEvents.list.empty.isDisplayed()).toBeFalsy();
      expect(appEvents.list.isTableView()).toBeTruthy();
      expect(appEvents.list.getTotalResults()).toBe(1);
      expect(appEvents.list.table.getCell(0, 1).getText()).toBe('audit\napp\ncreate');
      expect(appEvents.list.table.getCell(0, 2).getText()).toBe('person\nadmin');
    });

  });

});
