import { browser, promise, protractor } from 'protractor';

import { IApp } from '../../frontend/packages/cloud-foundry/src/cf-api.types';
import { APIResource } from '../../frontend/packages/store/src/types/api.types';
import { e2e } from '../e2e';
import { CFHelpers } from '../helpers/cf-e2e-helpers';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { CreateRoutesPage } from './po/routes-create-page.po';

describe('Application Routes -', () => {
  let cfHelper: CFHelpers;
  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid;
  let app: APIResource<IApp>;
  let appRoutes;
  let routeHostName;
  let routePath;

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    cfHelper = applicationE2eHelper.cfHelper;
    protractor.promise.controlFlow().execute(() => cfHelper.updateDefaultCfOrgSpace());

  });

  function spaceContainsRoute(spaceGuid: string, host: string, path: string): promise.Promise<boolean> {
    return applicationE2eHelper.cfHelper.fetchRoutesInSpace(cfGuid, spaceGuid)
      .then(routes => !!routes.find(route => route.entity.host === host && route.entity.path === '/' + path));
  }

  function waitForRouteToBeDeleted(spaceGuid: string, host: string, path: string, count = 0): promise.Promise<boolean> {
    return spaceContainsRoute(app.entity.space_guid, routeHostName, routePath).then(exists => {
      if (!exists) {
        return true;
      }
      count++;
      if (count === 10) {
        return false;
      }
      e2e.sleep(1000);
      return waitForRouteToBeDeleted(spaceGuid, host, path, count);
    });
  }

  // All of these tests assume that they run after each other

  it('Create skeleton app in default org/space', done => {
    // Needs browser.wait OR done
    cfHelper.createTestAppAndNav(ApplicationE2eHelper.createApplicationName(), false).then(pApp => {
      app = pApp.app;
      cfGuid = pApp.cfGuid;
      done();
    });
  });

  it('Go to Application Routes Tab', () => {
    appRoutes = new ApplicationPageRoutesTab(cfGuid, app.metadata.guid);
    appRoutes.navigateTo();

    // Check empty initial state
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');
  });

  it('Add a new route', () => {
    expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
    appRoutes.list.header.getAdd().click();

    const addRoutePage = new CreateRoutesPage(cfGuid, app.metadata.guid, app.entity.space_guid);
    expect(addRoutePage.isActivePage()).toBeTruthy();
    expect(addRoutePage.header.getTitleText()).toBe('Create Route');
    expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');

    expect(addRoutePage.stepper.canNext()).toBeFalsy();
    const httpRouteForm = addRoutePage.getHttpForm();
    httpRouteForm.fill({
      host: 'something',
    });
    expect(addRoutePage.stepper.canNext()).toBeTruthy();
    httpRouteForm.clearField('host');
    expect(addRoutePage.stepper.canNext()).toBeFalsy();

    routeHostName = '0-' + ApplicationE2eHelper.createRouteName();
    routePath = 'thisIsAPath';
    httpRouteForm.fill({
      host: routeHostName,
      path: routePath
    });
    expect(addRoutePage.stepper.canNext()).toBeTruthy();
    addRoutePage.stepper.next();

    // Check new route exists in table
    appRoutes.waitForPage();
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();

    expect(appRoutes.list.table.getRows().count()).toBe(1);
    appRoutes.list.table.getCell(0, 1).getText().then(route => {
      expect(route).toBeTruthy();
      expect(route.startsWith(routeHostName, 7)).toBeTruthy();
      expect(route.endsWith('/' + routePath)).toBeTruthy();
      expect(spaceContainsRoute(app.entity.space_guid, routeHostName, routePath)).toBeTruthy();
    });
    expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('highlight_off');
  });

  it('Unmap existing route', () => {
    const unmapActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    unmapActionMenu.waitUntilShown();
    unmapActionMenu.clickItem('Unmap');
    const confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(routeHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + routePath)).toBeGreaterThanOrEqual(0);
    });
    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click().then(() => {
      expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
      expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

      expect(spaceContainsRoute(app.entity.space_guid, routeHostName, routePath)).toBeTruthy();
    });
  });

  it('Map existing route', () => {
    const addRoutePage = new CreateRoutesPage(cfGuid, app.metadata.guid, app.entity.space_guid);

    // Bind the just unbound route back to app
    expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
    appRoutes.list.header.getAdd().click();

    expect(addRoutePage.isActivePage()).toBeTruthy();
    expect(addRoutePage.stepper.canNext()).toBeFalsy();
    expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');
    addRoutePage.type.select(1);

    const mapExistingRoutesList = addRoutePage.getMapExistingList();
    mapExistingRoutesList.header.getRefreshListButton().click();

    // Find the row index of the route that's just been unbound
    mapExistingRoutesList.header.setSearchText(routeHostName);
    const rowIndexP = mapExistingRoutesList.table.getTableData().then(rows =>
      rows.findIndex(row => row.route.startsWith(routeHostName, 7) && row.route.endsWith('/' + routePath))
    );

    expect(rowIndexP).toBeGreaterThanOrEqual(0);

    return rowIndexP.then(rowIndex => {
      mapExistingRoutesList.table.selectRow(rowIndex);
      expect(addRoutePage.stepper.canNext()).toBeTruthy();
      addRoutePage.stepper.next();

      // Check bound route exists in table
      appRoutes.waitForPage();
      expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();

      expect(appRoutes.list.table.getRows().count()).toBe(1);
      appRoutes.list.table.getCell(0, 1).getText().then(route => {
        expect(route).toBeTruthy();
        expect(route.startsWith(routeHostName, 7)).toBeTruthy();
        expect(route.endsWith('/' + routePath)).toBeTruthy();
      });
      expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('highlight_off');
    });
  });

  it('Delete route', () => {
    expect(appRoutes.isActivePage()).toBeTruthy();

    const deleteActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    deleteActionMenu.waitUntilShown();
    deleteActionMenu.clickItem('Delete');
    const confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(routeHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + routePath)).toBeGreaterThanOrEqual(0);
    });

    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click();
    expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    browser.wait(waitForRouteToBeDeleted(app.entity.space_guid, routeHostName, routePath),
      10000, 'Route should have been deleted from the space');
  });

  afterAll(() => {
    if (app) {
      // Route may or may not have been created. Run delete app such that it checks for routes associated with the app
      return applicationE2eHelper.deleteApplication({ cfGuid, app });
    }
  });
});
