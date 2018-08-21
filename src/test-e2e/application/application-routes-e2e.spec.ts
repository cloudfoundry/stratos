import { promise, protractor } from 'protractor';

import { IApp } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { CreateRoutesPage } from './po/routes-create-page.po';

describe('Application Routes -', () => {

  let applicationE2eHelper: ApplicationE2eHelper;
  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    protractor.promise.controlFlow().execute(() => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      testAppName = ApplicationE2eHelper.createApplicationName();
      applicationE2eHelper.createApp(
        cfGuid,
        e2e.secrets.getDefaultCFEndpoint().testOrg,
        e2e.secrets.getDefaultCFEndpoint().testSpace,
        testAppName,
        defaultCf
      ).then(appl => app = appl);
    });
  });

  let cfGuid, testAppName, app: APIResource<IApp>;

  function spaceContainsRoute(cfGuid: string, spaceGuid: string, host: string, path: string): promise.Promise<boolean> {
    return applicationE2eHelper.cfHelper.fetchRoutesInSpace(cfGuid, spaceGuid).then(routes => {
      return !!routes.filter(route => {
        return route.entity.host === host && route.entity.path === path;
      });
    });
  }

  fit('Add a new route', () => {

    const appRoutes = new ApplicationPageRoutesTab(cfGuid, app.metadata.guid);
    appRoutes.navigateTo();

    // Check empty initial state
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    // -------------------------- Test Create New Route
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

    const newRouteHostName = '0-' + ApplicationE2eHelper.createRouteName();
    const newRoutePathName = 'thisIsAPath';
    httpRouteForm.fill({
      host: newRouteHostName,
      path: newRoutePathName
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
      expect(route.startsWith(newRouteHostName)).toBeTruthy();
      expect(route.endsWith('/' + newRoutePathName)).toBeTruthy();
    });
    expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('No');
    expect(spaceContainsRoute(cfGuid, app.entity.space_guid, newRouteHostName, newRoutePathName)).toBeTruthy();

    // -------------------------- Test unmap of new route
    const unmapActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    unmapActionMenu.waitUntilShown();
    unmapActionMenu.clickItem('Unmap');
    let confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(newRouteHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + newRoutePathName)).toBeGreaterThanOrEqual(0);
    });
    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click();

    expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    expect(spaceContainsRoute(cfGuid, app.entity.space_guid, newRouteHostName, newRoutePathName)).toBeTruthy();

    // -------------------------- Test map of existing route
    // Bind the just unbound route back to app

    expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
    appRoutes.list.header.getAdd().click();

    expect(addRoutePage.isActivePage()).toBeTruthy();
    expect(addRoutePage.stepper.canNext()).toBeFalsy();
    expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');
    addRoutePage.type.select(1);

    const mapExistingRoutesList = addRoutePage.getMapExistingList();
    mapExistingRoutesList.header.getRefreshListButton().click();
    mapExistingRoutesList.table.getCell(0, 1).getText().then(route => {
      // TODO: RC harden
      const message = `Expect first entry in table to be the route we've just unbound`;
      console.log(route);
      console.log(newRouteHostName, newRoutePathName);
      expect(route).toBeTruthy();
      expect(route.startsWith(newRouteHostName)).toBeTruthy(message);
      expect(route.endsWith('/' + newRoutePathName)).toBeTruthy(message);
    });

    mapExistingRoutesList.table.selectRow(0);
    expect(addRoutePage.stepper.canNext()).toBeTruthy();
    addRoutePage.stepper.next();

    // Check new route exists in table
    appRoutes.waitForPage();
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();

    expect(appRoutes.list.table.getRows().count()).toBe(1);
    appRoutes.list.table.getCell(0, 1).getText().then(route => {
      console.log(route);
      console.log(newRouteHostName, newRoutePathName);
      expect(route).toBeTruthy();
      expect(route.startsWith(newRouteHostName)).toBeTruthy();
      expect(route.endsWith('/' + newRoutePathName)).toBeTruthy();
    });
    expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('No');

    // -------------------------- Test delete of route
    const deleteActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    deleteActionMenu.waitUntilShown();
    deleteActionMenu.clickItem('Delete');
    confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(newRouteHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + newRoutePathName)).toBeGreaterThanOrEqual(0);
    });
    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click();

    expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    expect(spaceContainsRoute(cfGuid, app.entity.space_guid, newRouteHostName, newRoutePathName)).toBeFalsy();

  });

  afterAll(() => {
    if (app) {
      applicationE2eHelper.deleteApplication({ cfGuid, app });
    }
  });
});
