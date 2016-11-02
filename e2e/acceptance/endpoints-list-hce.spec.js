'use strict';

var helpers = require('../po/helpers.po');
var credentialsFormHelper = require('../po/widgets/credentials-form.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var actionsMenuHelper = require('../po/widgets/actions-menu.po');
var confirmationModalHelper = require('../po/widgets/confirmation-modal.po');
var registerEndpoint = require('../po/endpoints/register-endpoint.po');
var serviceRegistation = require('../po/endpoints/service-instance-registration.po');

var endpointsHce = require('../po/endpoints/endpoints-list-hce.po');

describe('Endpoints - List HCEs', function () {

  function resetToLoggedIn(loginAsFunc) {
    return browser.driver.wait(resetTo.resetAllCnsi())
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginAsFunc();
      });
  }

  var hce = helpers.getHces().hce1;

  describe('Admin', function () {
    beforeAll(function () {
      resetToLoggedIn(loginPage.loginAsAdmin).then(function () {
        endpointsHce.showHceEndpoints();
        endpointsHce.isHceEndpoints();

        // Confirm the first row is the required one (to match creds later)
        var serviceInstancesTable = endpointsHce.getTable();
        expect(helpers.getTableCellAt(serviceInstancesTable, 0, 1).getText()).toEqual(hce.register.api_endpoint);
        expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toEqual('Disconnected');
      });
    });

    describe('Connect + Disconnect', function () {

      it('Correct action menu items - before connect', function () {
        var actionMenu = endpointsHce.getActionMenu(0);
        expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
        expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
        expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
      });

      it('Execute Connect', function () {
        // More detailed tests for the credentials form can be found in service-instance-registration.spec

        var actionMenu = endpointsHce.getActionMenu(0);
        // Open the action menu
        actionsMenuHelper.click(actionMenu)
          .then(function () {
            // Click on connect
            return actionsMenuHelper.clickItem(actionMenu, 0);
          })
          .then(function () {
            // Run through the credentials form + register
            expect(credentialsFormHelper.credentialsForm().isDisplayed()).toBeTruthy();
            credentialsFormHelper.fillCredentialsForm(hce.admin.username, hce.admin.password);
            return credentialsFormHelper.connect();
          })
          .then(function () {
            helpers.checkAndCloseToast("Successfully connected to 'hce'");
            // Should now show as 'connected'
            var serviceInstancesTable = endpointsHce.getTable();
            expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toEqual('Connected');
          });
      });

      it('Correct action menu items - before disconnect', function () {
        var actionMenu = endpointsHce.getActionMenu(0);
        expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
        expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Disconnect');
        expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
      });

      it('Execute Disconnect', function () {

        var actionMenu = endpointsHce.getActionMenu(0);
        // Open the action menu
        actionsMenuHelper.click(actionMenu)
          .then(function () {
            // Click on connect
            return actionsMenuHelper.clickItem(actionMenu, 0);
          })
          .then(function () {
            helpers.checkAndCloseToast('Helion Code Engine endpoint successfully disconnected');
            // Should now show as 'Disconnected'
            var serviceInstancesTable = endpointsHce.getTable();
            expect(helpers.getTableCellAt(serviceInstancesTable, 0, 2).getText()).toEqual('Disconnected');
          });
      });

      it('Correct action menu items - after disconnect', function () {
        var actionMenu = endpointsHce.getActionMenu(0);
        expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
        expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
        expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
      });

    });

    describe('Unregister + Register', function () {
      it('Correct state - before unregister', function () {
        var actionMenu = endpointsHce.getActionMenu(0);
        expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
        expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
        expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');

        // Add row for header
        expect(helpers.getTableRows(endpointsHce.getTable()).count()).toBe(1 + 1);
      });

      it('Execute Unregister', function () {
        var serviceInstancesTable = endpointsHce.getTable();
        // Add row for header
        expect(helpers.getTableRows(serviceInstancesTable).count()).toBe(1 + 1);

        var actionMenu = endpointsHce.getActionMenu(0);
        // Open the action menu
        actionsMenuHelper.click(actionMenu)
          .then(function () {
            // Click on unregister
            return actionsMenuHelper.clickItem(actionMenu, 1);
          })
          .then(function () {
            expect(confirmationModalHelper.isVisible()).toBeTruthy();
            // click on modal cancel
            return confirmationModalHelper.cancel();
          })
          .then(function () {
            // Open the action menu
            return actionsMenuHelper.click(actionMenu);
          })
          .then(function () {
            // Click on unregister
            return actionsMenuHelper.clickItem(actionMenu, 1);
          })
          .then(function () {
            expect(confirmationModalHelper.isVisible()).toBeTruthy();
            // Click on modal unregister
            return confirmationModalHelper.primary();
          })
          .then(function () {
            helpers.checkAndCloseToast('Helion Code Engine endpoint successfully unregistered');
            // Should now have no entries
            expect(helpers.getTableRows(serviceInstancesTable).count()).toBe(0);
          });
      });

      it('Execute Register', function () {
        var serviceInstancesTable = endpointsHce.getTable();
        // Add row for header
        expect(helpers.getTableRows(serviceInstancesTable).count()).toBe(0);

        // Click register that's now appeared in centre screen message
        endpointsHce.inlineRegister()
          .then(function () {
            // Validate the register slide out is shown, add details and continue
            expect(registerEndpoint.isVisible().isDisplayed()).toBeTruthy();
            expect(registerEndpoint.getEndpointType()).toBe('hce');
            return registerEndpoint.populateAndRegister(hce.register.api_endpoint, hce.register.cnsi_name,
              hce.register.skip_ssl_validation);
          })
          .then(function () {
            helpers.checkAndCloseToast("Helion Code Engine endpoint '" + hce.register.cnsi_name + "' successfully registered");
            // Add row for header
            expect(helpers.getTableRows(serviceInstancesTable).count()).toBe(1 + 1);
          });
      });

    });

    describe('Permissions', function () {
      it('Register should be visible to console admins', function () {
        expect(endpointsHce.headerRegisterVisible()).toBeTruthy();
      });
    });
  });

  describe('Non-Admin', function () {

    beforeAll(function () {
      resetToLoggedIn(loginPage.loginAsNonAdmin).then(function () {
        serviceRegistation.completeRegistration().then(function() {
          endpointsHce.showHceEndpoints();
          endpointsHce.isHceEndpoints();
        });
      });
    });

    describe('Permissions', function () {
      it('Register should not be visible to non-console admins', function () {
        expect(endpointsHce.headerRegisterVisible()).toBeFalsy();
      });
    });
  });

});
