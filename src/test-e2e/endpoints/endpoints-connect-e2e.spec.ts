import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { LoginPage } from '../login/login.po';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { FormItemMap } from '../po/form.po';
import { MenuComponent } from '../po/menu.po';
import { SnackBarComponent } from '../po/snackbar.po';
import { ConnectDialogComponent } from './connect-dialog.po';
import { EndpointMetadata, EndpointsPage } from './endpoints.po';

describe('Endpoints', () => {
  const endpointsPage = new EndpointsPage();

  describe('Connect/Disconnect endpoints -', () => {

    beforeAll(() => {
      e2e.setup(ConsoleUserType.user)
        .clearAllEndpoints()
        .registerDefaultCloudFoundry();
    });

    describe('endpoint `Connect` -', () => {
      const toConnect = e2e.secrets.getDefaultCFEndpoint();
      const connectDialog = new ConnectDialogComponent();

      it('should open the credentials form', () => {
        endpointsPage.waitForPage();
        // expect(endpointsPage.isActivePage()).toBeTruthy();

        // Close the snack bar telling us that there are no connected endpoints
        connectDialog.snackBar.waitForMessage('There are no connected endpoints, connect with your personal credentials to get started.');
        connectDialog.snackBar.safeClose();

        // Get the row in the table for this endpoint
        endpointsPage.table.getRowForEndpoint(toConnect.name).then(row => {
          endpointsPage.table.openRowActionMenuByRow(row);
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
        connectDialog.snackBar.waitForMessage(`Connected endpoint '${toConnect.name}'`);
        endpointsPage.table.getEndpointDataForEndpoint(toConnect.name).then((ep: EndpointMetadata) => {
          expect(ep).toBeDefined();
          expect(ep.connected).toBeTruthy();
        });
        connectDialog.waitUntilNotShown();
        endpointsPage.table.getRowForEndpoint(toConnect.name).then(row => {
          endpointsPage.table.openRowActionMenuByRow(row);
          const menu = new MenuComponent();
          menu.waitUntilShown('Endpoint Action Menu');
          return menu.getItemMap().then(items => {
            expect(items['connect']).not.toBeDefined();
            expect(items['disconnect']).toBeDefined();
            // Only admins can unregister
            expect(items['unregister']).not.toBeDefined();
            return menu.close();
          });

        });
      });

      // NOTE: We connected as the User not the Admin, so logging in as admin will NOT have the endpoint connected
      it('should go directly to endpoints view on logout and login (as admin)', () => {
        endpointsPage.header.logout();
        const loginPage = new LoginPage();
        loginPage.waitForLogin();
        loginPage.login(e2e.secrets.getConsoleAdminUsername(), e2e.secrets.getConsoleAdminPassword());
        loginPage.waitForLoading();
        loginPage.waitForApplicationPage();
        expect(endpointsPage.isActivePage()).toBeTruthy();
      });

      it('should go directly to applications view on logout and login', () => {
        endpointsPage.header.logout();
        const loginPage = new LoginPage();
        loginPage.waitForLogin();
        loginPage.login(e2e.secrets.getConsoleNonAdminUsername(), e2e.secrets.getConsoleNonAdminPassword());
        loginPage.waitForLoading();
        loginPage.waitForApplicationPage();
        const appPage = new ApplicationsPage();
        expect(appPage.isActivePage()).toBeTruthy();
      });

    });

    describe('endpoint `Disconnect` -', () => {

      const toDisconnect = e2e.secrets.getDefaultCFEndpoint();

      it('should update row in table when disconnected', () => {
        endpointsPage.navigateTo();

        endpointsPage.table.getRowForEndpoint(toDisconnect.name).then(row => {
          endpointsPage.table.openRowActionMenuByRow(row);
          const menu = new MenuComponent();
          menu.waitUntilShown();
          return menu.getItemMap().then(items => {
            expect(items['connect']).not.toBeDefined();
            expect(items['disconnect']).toBeDefined();
            items['disconnect'].click();
            ConfirmDialogComponent.expectDialogAndConfirm('Disconnect', 'Disconnect Endpoint');

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
