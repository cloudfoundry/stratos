'use strict';

var helpers = require('../po/helpers.po');
var credentialsFormHelper = require('../po/credentials-form.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var actionsMenuHelper = require('../po/actions-menu.po');

var endpointsHce = require('../po/endpoints-list-hce.po');

describe('Endpoints - List HCEs', function () {

  function resetToLoggedIn() {
    return browser.driver.wait(resetTo.resetAllCnsi())
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.loginAsAdmin();
      });
  }

  var hce = helpers.getHces().hce1;

  beforeAll(function () {
    resetToLoggedIn().then(function () {
      endpointsHce.goToHceEndpoints();
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

  describe('Register + Unregister', function () {
    //TODO: Complete tests for register and unregister on the endpoints list hce page
  });
  
});
