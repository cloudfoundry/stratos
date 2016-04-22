'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var navbar = require('../po/navbar.po');
var loginPage = require('../po/login-page.po');
var registration = require('../po/service-instance-registration.po');

describe('Service Instance Registration', function () {
  beforeAll(function () {
    browser.driver.wait(resetTo.devWorkflow(true))
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.login('dev', 'dev');
      });
  });

  describe('service instances table', function () {
    it('should be displayed', function () {
      expect(registration.registrationOverlay().isDisplayed()).toBeTruthy();
    });

    it('should show at least one service instance', function () {
      var serviceInstancesTable = registration.serviceInstancesTable();
      expect(helpers.getTableRows(serviceInstancesTable).count()).toBeGreaterThan(0);
    });

    it('should show `Connect` link for each service instance', function () {
      var serviceInstancesTable = registration.serviceInstancesTable();
      var serviceInstanceRows = helpers.getTableRows(serviceInstancesTable);
      for (var i = 0; i < serviceInstanceRows.count(); i++) {
        expect(registration.connectLink(i).isDisplayed()).toBeTruthy();
      }
    });

    it('should have the `Done` button disabled initially', function () {
      expect(registration.doneButton().isEnabled()).toBeFalsy();
    });
  });

  describe('service instance `Connect` clicked', function () {
    beforeAll(function () {
      registration.connect(0);
    });

    it('should update service instance data', function () {
      var serviceInstancesTable = registration.serviceInstancesTable();
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 3).getText()).not.toBe('');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 4).getText()).not.toBe('');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 5).getText()).toBe('DISCONNECT');
      expect(registration.serviceInstanceStatus(0, 'helion-icon-Active_L').isDisplayed()).toBeTruthy();
    });

    it('should show `1 CLUSTER REGISTERED` next to `Done` button', function () {
      expect(registration.registrationNotification().getText()).toBe('1 CLUSTER REGISTERED');
    });

    it('should enable `Done` button', function () {
      expect(registration.doneButton().isEnabled()).toBeTruthy();
    });
  });

  describe('service instance `Disconnect`', function () {
    it('should update row in table when disconnected', function () {
      var serviceInstancesTable = registration.serviceInstancesTable();
      registration.disconnect(0);

      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 3).getText()).toBe('');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 4).getText()).toBe('');
      expect(helpers.getTableCellAt(serviceInstancesTable, 0, 5).getText()).toBe('CONNECT');
    });

    it('should disable `Done` button if no service instances registered', function () {
      expect(registration.doneButton().isEnabled()).toBeFalsy();
    });
  });

  describe('service instance - complete registration', function () {
    beforeAll(function () {
      registration.connect(0);
    });

    it('should show applications view when `Done` clicked', function () {
      registration.completeRegistration();

      expect(registration.registrationOverlay().isPresent()).toBeFalsy();
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/list/gallery-view');
    });

    it('should go directly to applications view on logout and login', function () {
      navbar.logout();
      loginPage.login('dev', 'dev');

      expect(registration.registrationOverlay().isPresent()).toBeFalsy();
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/list/gallery-view');
    });
  });
});
