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

describe('Endpoints', () => {
  const helpers = new E2EHelpers();
  const secrets = new SecretsHelpers();
  const resets = new ResetsHelpers();
  const endpointsPage = new EndpointsPage();
  const applications = new ApplicationsPage();
  const services = new ServicesPage();
  const cloudFoundry = new CloudFoundryPage();

  describe('Connect Endpoints -', () => {
  });


  //   describe('Connect/Disconnect endpoints -', () => {
  //     var cf = helpers.getRegisteredService();
  //     var cfRowIndex;
  //     beforeAll(function (done) {
  //       resetToLoggedIn(resetTo.resetAllCnsi, false)
  //         .then(() => {
  //           endpointsPage.isEndpoints().then(function (isEndpoints) {
  //             expect(isEndpoints).toBe(true);
  //           });
  //         })
  //         .then(() => {
  //           // Find the CF row to test on
  //           return endpointsPage.getRowWithEndpointName(helpers.getRegisteredService().register.cnsi_name);
  //         })
  //         .then(function (index) {
  //           expect(index).toBeDefined();
  //           cfRowIndex = index;
  //           done();
  //         });
  //     });

  //     describe('endpoint `Connect` -', () => {

  //       beforeAll(function (done) {
  //         endpointsPage.endpointConnectLink(cfRowIndex).then(function (button) {
  //           button.click().then(done);
  //         });
  //       });

  //       it('should open the credentials form', () => {
  //         expect(endpointsPage.credentialsForm().isDisplayed()).toBeTruthy();
  //       });

  //       it('should show the cluster name and URL as readonly in the credentials form', () => {
  //         var endpointsTable = endpointsPage.getEndpointTable();
  //         var name = helpers.getTableCellAt(endpointsTable, cfRowIndex, 0).getText().then(function (text) {
  //           return text.toLowerCase();
  //         });
  //         var url = helpers.getTableCellAt(endpointsTable, cfRowIndex, 3).getText().then(function (text) {
  //           return text.replace('https://', '');
  //         });

  //         var fields = endpointsPage.credentialsFormFields();
  //         expect(fields.get(0).getAttribute('value')).toBe(name);
  //         expect(fields.get(1).getAttribute('value')).toBe(url);
  //         expect(fields.get(2).getAttribute('value')).toBe('');
  //         expect(fields.get(3).getAttribute('value')).toBe('');
  //       });

  //       it('should disable connect button if username and password are blank', () => {
  //         expect(endpointsPage.credentialsFormConnectButton().isEnabled()).toBeFalsy();
  //       });

  //       it('should enable connect button if username and password are not blank', () => {
  //         endpointsPage.credentialsFormFill(cf.admin.username, cf.admin.password);
  //         expect(endpointsPage.credentialsFormConnectButton().isEnabled()).toBeTruthy();
  //       });

  //       it('should update service instance data on register', () => {
  //         endpointsPage.credentialsFormEndpointConnect().then(() => {
  //           helpers.checkAndCloseToast(/Successfully connected to '(?:cf)'/);
  //           var endpointsTable = endpointsPage.getEndpointTable();
  //           expect(helpers.getTableCellAt(endpointsTable, cfRowIndex, 5).getText()).toBe('DISCONNECT');
  //           expect(endpointsPage.endpointIsConnected(cfRowIndex)).toBeTruthy();
  //         });
  //       });

  //       it('should go directly to endpoint view on logout and login (as admin)', () => {
  //         // This would be better in the 'non admin' section, however it's easier to test here with a service registered
  //         // This removes the need to go through/test the endpoint dashboard registration process alongside this test
  //         navbar.logout();
  //         loginPage.waitForLogin();
  //         loginPage.login(helpers.getAdminUser(), helpers.getAdminPassword());

  //         expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#!/endpoint');
  //       });

  //       it('should go directly to applications view on logout and login', () => {
  //         navbar.logout();
  //         loginPage.waitForLogin();
  //         loginPage.login(helpers.getUser(), helpers.getPassword());

  //         expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#!/cf/applications/list/gallery-view');
  //       });

  //     });

  //     describe('endpoint `Disconnect` -', () => {
  //       it('should update row in table when disconnected', () => {
  //         endpointsPage.goToEndpoints();
  //         endpointsPage.waitForEndpointTable();
  //         endpointsPage.endpointDisconnectLink(cfRowIndex)
  //           .then(function (button) {
  //             return button.click();
  //           })
  //           .then(() => {
  //             helpers.checkAndCloseToast(/Successfully disconnected endpoint '(?:cf)'/);
  //             var endpointsTable = endpointsPage.getEndpointTable();
  //             expect(helpers.getTableCellAt(endpointsTable, cfRowIndex, 5).getText()).toBe('CONNECT');
  //           });
  //       });

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

});
