import { E2EHelpers, ConsoleUserType } from '../helpers/e2e-helpers';
import { browser } from 'protractor';
import { ResetsHelpers } from '../helpers/reset-helpers';
import { EndpointsPage, EndpointMetadata, resetToLoggedIn } from './endpoints.po';
import { ApplicationsPage } from '../applications/applications.po';
import { SideNavMenuItem } from '../po/side-nav.po';
import { CloudFoundryPage } from '../cloud-foundry/cloud-foundry.po';
import { ServicesPage } from '../services/services.po';
import { SnackBarComponent } from '../po/snackbar.po';
import { SecretsHelpers } from '../helpers/secrets-helpers';
import { MenuComponent } from '../po/menu.po';
import { ConnectDialogComponent } from './connect-dialog.po';
import { FormComponent, FormItemMap } from '../po/form.po';
import { LoginPage } from '../login/login.po';

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();

  describe('Connect/Disconnect endpoints -', () => {

    beforeAll(() => {
      resetToLoggedIn(resets.resetAllEndpoints, false);
    });

    describe('endpoint `Connect` -', () => {

      const toConnect = secrets.getDefaultCFEndpoint();
      const connectDialog = new ConnectDialogComponent();

      it('should open the credentials form', () => {
        expect(endpointsPage.isActivePage()).toBeTruthy();

        // Get the row in the table for this endpoint
        endpointsPage.table.getRowForEndpoint(toConnect.name).then(row => {
          endpointsPage.table.openActionMenu(row);
          const menu = new MenuComponent();
          menu.waitUntilShown();
          return menu.getItemMap().then(items => {
            expect(items['connect']).toBeDefined();
            items['connect'].click();
            connectDialog.waitUntilShown();
            // Connect dialog should be shown
            expect(connectDialog.isPresent()).toBeTruthy();
            expect(connectDialog.isDisplayed()).toBeTruthy();

          });
        });
      });

      it('should have empty username and password fields in the form', () => {
        connectDialog.form.getControlsMap().then((ctrls: FormItemMap) => {
          expect(ctrls['authtype']).toBeDefined();
          expect(ctrls['username']).toBeDefined();
          expect(ctrls['password']).toBeDefined();
          expect(ctrls['authtype'].value).toEqual('creds');
          expect(ctrls['username'].text).toEqual('');
          expect(ctrls['password'].text).toEqual('');
        });
      });

      it('should disable connect button if username and password are blank', () => {
        expect(connectDialog.canConnect()).toBeFalsy();
      });

      it('should enable connect button if username and password are not blank', () => {
        connectDialog.form.fill({
          username: toConnect.creds.admin.username,
          password: toConnect.creds.admin.password
        });
        expect(connectDialog.canConnect()).toBeTruthy();
      });

      it('should update service instance data on register', () => {
        connectDialog.connect();
        // Wait for snackbar
        connectDialog.snackBar.waitUntilShown();
        endpointsPage.table.getEndpointDataForEndpoint(toConnect.name).then((ep: EndpointMetadata) => {
          expect(ep.connected).toBeTruthy();
        });

        endpointsPage.table.getRowForEndpoint(toConnect.name).then(row => {
          endpointsPage.table.openActionMenu(row);
          const menu = new MenuComponent();
          menu.waitUntilShown();
          return menu.getItemMap().then(items => {
            expect(items['connect']).not.toBeDefined();
            expect(items['disconnect']).toBeDefined();
            expect(items['unregister']).toBeDefined();
            return menu.close();
          });

        });
      });

      // NOTE: We connected as the User not the Admin, so logging in as admin will NOT have the endpoint connected
      it('should go directly to endpoints view on logout and login (as admin)', () => {
        endpointsPage.header.logout();
        const loginPage = new LoginPage();
        loginPage.waitForLogin();
        loginPage.login(secrets.getConsoleAdminUsername(), secrets.getConsoleAdminPassword());
        loginPage.waitForApplicationPage();
        expect(endpointsPage.isActivePage()).toBeTruthy();
      });

      it('should go directly to applications view on logout and login', () => {
        endpointsPage.header.logout();
        const loginPage = new LoginPage();
        loginPage.waitForLogin();
        loginPage.login(secrets.getConsoleNonAdminUsername(), secrets.getConsoleNonAdminPassword());
        // loginPage.login(secrets.getConsoleAdminUsername(), secrets.getConsoleAdminPassword());
        loginPage.waitForApplicationPage();
        const appPage = new ApplicationsPage();
        expect(appPage.isActivePage()).toBeTruthy();
      });

    });

    describe('endpoint `Disconnect` -', () => {

      const toDisconnect = secrets.getDefaultCFEndpoint();

      it('should update row in table when disconnected', () => {
        endpointsPage.navigateTo();

        endpointsPage.table.getRowForEndpoint(toDisconnect.name).then(row => {
          endpointsPage.table.openActionMenu(row);
          const menu = new MenuComponent();
          menu.waitUntilShown();
          return menu.getItemMap().then(items => {
            expect(items['connect']).not.toBeDefined();
            expect(items['disconnect']).toBeDefined();
            items['disconnect'].click();

            // Wait for snackbar
            const snackBar = new SnackBarComponent();
            snackBar.waitUntilShown();
            expect(endpointsPage.isNoneConnectedSnackBar(snackBar)).toBeTruthy();

            endpointsPage.table.getEndpointDataForEndpoint(toDisconnect.name).then((data: EndpointMetadata) => {
              expect(data.connected).toBeFalsy();
            });
          });
        });
      });
    });
  });
});


    //     });

    //     });

    //   });

    //   describe('Error States -', () => {

    //     it('Unconnected', () => {
    //       // See checks in 'Workflow on log in (admin/non-admin + no endpoints/some endpoints)/Some As Admin/registered
    //       // endpoints/endpoints table/should show correct table content'
    //     });

    //     it('Token Expired', () => {
    //       resetToLoggedIn(resetTo.resetAllCnsi, false)
    //         .then(() => {
    //           // Connect the test non-admin user to all cnsis in params
    //           return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
    //         })
    //         .then(() => {
    //           // This is the magic that will cause the endpoint tokens to appear as expired
    //           helpers.forceDate(2100, 1, 20);
    //           endpointsPage.showEndpoints();
    //           return endpointsPage.isEndpoints();
    //         })
    //         .then(function (isEndpoints) {
    //           expect(isEndpoints).toBe(true);
    //           expect(endpointsPage.getEndpointTable().isDisplayed()).toBeTruthy();
    //           return endpointsPage.getRowWithEndpointName(helpers.getRegisteredService().register.cnsi_name);
    //         })
    //         .then(function (cfRowIndex) {
    //           expect(cfRowIndex).toBeDefined();
    //           var errorRow = endpointsPage.endpointError(cfRowIndex);
    //           expect(errorRow.isPresent()).toBeTruthy();
    //           var div = errorRow.element(by.css('.console-popover-alert'));
    //           expect(div.isPresent()).toBeTruthy();
    //           expect(helpers.hasClass(div, 'console-popover-alert-error')).toBeTruthy();
    //           div.element(by.css('.popover-content')).getText().then(function (text) {
    //             expect(text.indexOf('Token has expired')).toBe(0);
    //           });
    //         });
    //     });
    //   });
    //   });
