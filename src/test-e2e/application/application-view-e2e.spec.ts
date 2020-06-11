import { protractor } from 'protractor';

import { IApp } from '../../frontend/packages/cloud-foundry/src/cf-api.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-helpers';
import { ConsoleUserType, E2EHelpers } from '../helpers/e2e-helpers';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageEventsTab } from './po/application-page-events.po';
import { ApplicationPageInstancesTab } from './po/application-page-instances.po';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { ApplicationPageSummaryTab } from './po/application-page-summary.po';
import { ApplicationPageVariablesTab } from './po/application-page-variables.po';
import { CreateRoutesPage } from './po/routes-create-page.po';

describe('Application View -', () => {
  let cfHelper: CFHelpers;
  let applicationE2eHelper: ApplicationE2eHelper;
  const appName = ApplicationE2eHelper.createApplicationName();
  let app: APIResource<IApp>;
  let appSummary: ApplicationPageSummaryTab;
  let defaultStack = '';
  let cfGuid: string;

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
  });

  beforeAll(() => {
    return cfHelper.fetchDefaultCFEndpointStack().then(stack => defaultStack = stack);
  });

  afterAll(() => {
    if (app) {
      return applicationE2eHelper.deleteApplication(null, { appGuid: app.metadata.guid }, false);
    }
  });

  it('Create skeleton app in default org/space', done => {
    // Needs browser.wait OR done
    cfHelper.createTestAppAndNav(appName).then(pApp => {
      app = pApp.app;
      cfGuid = pApp.cfGuid;
      appSummary = new ApplicationPageSummaryTab(cfGuid, app.metadata.guid);
      done();
    });
  });

  describe('Breadcrumbs', () => {

    function testApplicationsBreadcrumb() {
      appSummary.breadcrumbs.waitUntilShown();
      appSummary.breadcrumbs.getBreadcrumbs().then(breadcrumbs => {
        expect(breadcrumbs.length).toBe(1);
        expect(breadcrumbs[0].label).toBe('Applications');
      });
    }

    it('Fresh load', () => {
      // Should be on the app summary page already
      appSummary.waitForPage();
      testApplicationsBreadcrumb();
    });

    it('From App Wall', () => {
      // Start at app wall
      const appWall = new ApplicationsPage();
      appWall.navigateTo();
      appWall.waitForPage();
      // Nav to app summary via app wall
      ApplicationsPage.goToAppSummary(app.entity.name, cfGuid, app.metadata.guid);
      testApplicationsBreadcrumb();
    });
  });

  describe('Tabs', () => {
    beforeAll(() => {
      ApplicationsPage.goToAppSummary(appName, cfGuid, app.metadata.guid);
    });

    it('Walk tabs', () => {
      appSummary.goToInstancesTab();
      appSummary.goToRoutesTab();
      appSummary.goToLogStreamTab();
      appSummary.goToServicesTab();
      appSummary.goToVariablesTab();
      appSummary.goToEventsTab();
      appSummary.goToSummaryTab();
    });

    describe('Summary Tab -', () => {
      it('Status', () => {
        appSummary.goToSummaryTab();
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
        appSummary.cardDeployInfo.waitForTitle('Deployment Info');
        expect(appSummary.cardDeployInfo.getContent()).toBe('None');
      });
    });

    describe('Instances Tab -', () => {
      let appInstances: ApplicationPageInstancesTab;

      beforeAll(() => {
        appInstances = new ApplicationPageInstancesTab(cfGuid, app.metadata.guid);
        appInstances.goToInstancesTab();
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
        appRoutes = new ApplicationPageRoutesTab(cfGuid, app.metadata.guid);
        appRoutes.goToRoutesTab();
        appRoutes.waitForPage();
      });

      it('Empty Routes Table', () => {
        expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
        expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
        expect(appRoutes.list.empty.getCustom().getComponent().isDisplayed()).toBeTruthy();
        expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');
      });

      it('Should be able to cancel from Add Route', () => {
        expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
        appRoutes.list.header.getAdd().click();

        const addRoutePage = new CreateRoutesPage(cfGuid, app.metadata.guid, app.entity.space_guid);
        expect(addRoutePage.isActivePage()).toBeTruthy();
        expect(addRoutePage.header.getTitleText()).toBe('Create Route');
        expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');

        expect(addRoutePage.stepper.canCancel()).toBeTruthy();
        addRoutePage.stepper.cancel();

        // Should return back to App Routes
        appRoutes.waitForPage();
      });
    });

    // Events tab tests should come before anything else adds events
    describe('Events Tab -', () => {
      let appEvents: ApplicationPageEventsTab;

      beforeAll(() => {
        appEvents = new ApplicationPageEventsTab(cfGuid, app.metadata.guid);
        appEvents.goToEventsTab();
        appEvents.waitForPage();
      });

      it('One row in events table', () => {
        expect(appEvents.list.empty.isDisplayed()).toBeFalsy();
        expect(appEvents.list.isTableView()).toBeTruthy();
        expect(appEvents.list.getTotalResults()).toBe(1);
        expect(appEvents.list.table.getCell(0, 1).getText()).toBe('audit\napp\ncreate');
        expect(appEvents.list.table.getCell(0, 0).getText()).toBe('person\nadmin');
      });

    });

    describe('Variables Tab -', () => {
      let appVariables: ApplicationPageVariablesTab;

      it('Navigate to variables tab', () => {
        appVariables = new ApplicationPageVariablesTab(cfGuid, app.metadata.guid);
        appVariables.goToVariablesTab();
        appVariables.waitForPage();
      });

      it('Empty Variables Table', () => {
        expect(appVariables.list.empty.getDefault().isPresent()).toBeTruthy();
        expect(appVariables.list.empty.getDefault().getComponent().getText()).toBe('There are no variables');
      });

      it('CRUD Env Var', () => {
        appVariables.list.empty.waitUntilShown();

        // Add Env Var
        const envVarName = E2EHelpers.createCustomName('envVar');
        const envVarValue = 'new env var value';
        appVariables.addVariable(envVarName, envVarValue);

        appVariables.list.table.waitUntilNotBusy();

        expect(appVariables.list.table.getRows().count()).toBe(1);
        appVariables.list.table.waitForCellText(0, 1, envVarName);
        appVariables.list.table.waitForCellText(0, 2, envVarValue);

        // Edit Env Var
        const envVarValueEdited = `${envVarValue}-edited`;
        appVariables.editVariable(0, envVarValueEdited);
        appVariables.list.table.waitForCellText(0, 2, envVarValueEdited);

        // Delete Env Var
        appVariables.deleteVariable(0, envVarName);
        appVariables.list.empty.waitUntilShown();
      });

    });
  });

});
