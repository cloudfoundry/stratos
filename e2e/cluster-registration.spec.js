'use strict';

var helpers = require('./po/helpers.po');
var loginPage = require('./po/login-page.po');
var navbar = require('./po/navbar.po');
var clusterRegistration = require('./po/cluster-registration.po');
var registration = require('./po/service-instance-registration.po');

describe('Cluster Registration (ITOps)', function () {
  beforeEach(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
  });

  afterAll(function () {
    clusterRegistration.addClusters();
  });

  it('should not be displayed with cluster count > 0', function () {
    loginPage.loginAsAdmin();

    expect(clusterRegistration.registrationOverlay().isPresent()).toBeFalsy();
    expect(registration.registrationOverlay().isPresent()).toBeFalsy();

    navbar.logout();
  });

  it('should be displayed with cluster count === 0', function (done) {
    // don't need to login again since clearing clusters already creates new session
    clusterRegistration.clearClusters().then(function () {
      browser.driver.sleep(1000);

      expect(clusterRegistration.registrationOverlay().isPresent()).toBeTruthy();
      expect(registration.registrationOverlay().isPresent()).toBeFalsy();

      done();
    });
  });
});
