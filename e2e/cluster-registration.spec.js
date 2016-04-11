'use strict';

var helpers = require('./po/helpers.po');
var loginPage = require('./po/login-page.po');
var navbar = require('./po/navbar.po');
var clusterRegistration = require('./po/cluster-registration.po');
var registration = require('./po/service-instance-registration.po');

describe('Cluster Registration (ITOps)', function () {
  beforeAll(function () {
    clusterRegistration.clearClusters();
    helpers.setBrowserNormal();
    helpers.loadApp();
  });

  it('should be displayed with cluster count === 0', function () {
    loginPage.loginAsAdmin();

    expect(clusterRegistration.registrationOverlay().isPresent()).toBeTruthy();
    expect(registration.registrationOverlay().isPresent()).toBeFalsy();
  });

  describe('- add cluster form', function () {
    it('should appear when "Add Cluster" clicked from message box', function () {
      clusterRegistration.addClusterFromMessageBox();
      expect(clusterRegistration.addClusterForm().isDisplayed()).toBeTruthy();
    });

    it('should not allow add with invalid cluster address format', function () {
      clusterRegistration.fillAddClusterForm('bad-address', '');
      expect(clusterRegistration.registerButton().isEnabled()).toBeFalsy();
    });

    it('should enable "Register" button when all fields filled out', function () {
      clusterRegistration.fillAddClusterForm('api.123.45.67.89.xip.io', 'foo');
      expect(clusterRegistration.registerButton().isEnabled()).toBeTruthy();
    });

    it('should add cluster to table and close flyout', function () {
      clusterRegistration.registerCluster();
      expect(clusterRegistration.clusterTableRows().count()).toBe(1);
    });

    it('should appear when "Add Cluster" button clicked from table', function () {
      clusterRegistration.addClusterFromTable();
      expect(clusterRegistration.addClusterForm().isDisplayed()).toBeTruthy();
    });

    it('should not allow add with duplicate cluster address', function () {
      clusterRegistration.fillAddClusterForm('api.123.45.67.89.xip.io', 'bar');
      expect(clusterRegistration.registerButton().isEnabled()).toBeFalsy();
      clusterRegistration.cancel();
    });

    it('should show cleared form on open each time', function () {
      clusterRegistration.addClusterFromTable();

      var fields = clusterRegistration.addClusterFormFields();
      expect(fields.get(0).getAttribute('value')).toBe('');
      expect(fields.get(1).getAttribute('value')).toBe('');
    });

    it('should hide form and not add cluster when "Cancel" clicked', function () {
      clusterRegistration.fillAddClusterForm('api.123.45.67.89.xip.io', 'bar');
      clusterRegistration.cancel();
      expect(clusterRegistration.addClusterForm().isDisplayed()).toBeFalsy();
      expect(clusterRegistration.clusterTableRows().count()).toBe(1);
    });
  });

  it('should not be displayed with cluster count > 0', function () {
    helpers.loadApp();
    loginPage.loginAsAdmin();

    expect(clusterRegistration.registrationOverlay().isPresent()).toBeFalsy();
    expect(registration.registrationOverlay().isPresent()).toBeFalsy();
  });
});
