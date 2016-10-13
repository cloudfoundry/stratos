'use strict';

var helpers = require('../po/helpers.po');
var credentialsFormHelper = require('../po/credentials-form.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var actionsMenuHelper = require('../po/actions-menu.po');
var endpointsHcf = require('../po/endpoints-list-hcf.po');

describe('Endpoints - List HCFs', function () {

  function resetToLoggedIn() {
    return browser.driver.wait(resetTo.resetAllCnsi())
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.loginAsAdmin();
      });
  }

  var hcf = helpers.getHcfs().hcf1;

  beforeAll(function () {
    resetToLoggedIn()
      .then(function () {
        return endpointsHcf.goToHcfEndpoints();
      })
      .then(function () {
        endpointsHcf.isHcfEndpoints();

        // Confirm the first tile is the required one (to match creds later)
        expect(endpointsHcf.getTileTitle(0)).toEqual(hcf.register.cnsi_name.toUpperCase());
        expect(endpointsHcf.isTileConnected(0)).toBeFalsy();
      });
  });

  describe('Connect + Disconnect', function () {

    it('Correct action menu items - before connect', function () {
      var actionMenu = endpointsHcf.getTileActionMenu(0);
      expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
      expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
      expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
    });

    it('Execute Connect', function () {
      // More detailed tests for the credentials form can be found in service-instance-registration.spec

      var actionMenu = endpointsHcf.getTileActionMenu(0);
      // Open the action menu
      actionsMenuHelper.click(actionMenu)
        .then(function () {
          // Click on connect
          return actionsMenuHelper.clickItem(actionMenu, 0);
        })
        .then(function () {
          // Run through the credentials form + register
          expect(credentialsFormHelper.credentialsForm().isDisplayed()).toBeTruthy();
          credentialsFormHelper.fillCredentialsForm(hcf.admin.username, hcf.admin.password);
          return credentialsFormHelper.connect();
        })
        .then(function () {
          // Should now show as 'connected'
          expect(endpointsHcf.isTileConnected(0)).toBeTruthy();
        });
    });

    it('Correct action menu items - before disconnect', function () {
      var actionMenu = endpointsHcf.getTileActionMenu(0);
      expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
      expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Disconnect');
      expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
    });

    it('Execute Disconnect', function () {

      var actionMenu = endpointsHcf.getTileActionMenu(0);
      // Open the action menu
      actionsMenuHelper.click(actionMenu)
        .then(function () {
          // Click on connect
          return actionsMenuHelper.clickItem(actionMenu, 0);
        })
        .then(function () {
          // Should now show as 'Disconnected'
          expect(endpointsHcf.isTileConnected(0)).toBeFalsy();
        });
    });

    it('Correct action menu items - after disconnect', function () {
      var actionMenu = endpointsHcf.getTileActionMenu(0);
      expect(actionsMenuHelper.getItems(actionMenu).count()).toBe(2);
      expect(actionsMenuHelper.getItemText(actionMenu, 0)).toEqual('Connect');
      expect(actionsMenuHelper.getItemText(actionMenu, 1)).toEqual('Unregister');
    });

  });

  describe('Register + Unregister', function () {
    //TODO: Complete tests for register and unregister on the endpoints list hcf page
  });

});
