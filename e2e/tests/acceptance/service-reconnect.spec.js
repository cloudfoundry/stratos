'use strict';

var helpers = require('../../po/helpers.po');
var resetTo = require('../../po/resets.po');
var navbar = require('../../po/navbar.po');
var loginPage = require('../../po/login-page.po');
var registration = require('../../po/endpoints/service-instance-registration.po');
var clusterSettings = require('../../po/widgets/cluster-settings.po');

describe('Account Seetings: Service Instance Reconnect', function () {

  beforeAll(function () {
    browser.driver.wait(resetTo.resetAllCnsi()).then(function () {
      return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
    }).then(function () {
      helpers.setBrowserNormal();
      helpers.loadApp();
      loginPage.loginAsAdmin();
    });
  });

  it('Should allow service to be reconnected', function () {

    helpers.forceDate(2100,1,20);
    navbar.showAccountSettings();

    var settings = clusterSettings.getClusterSettings();
    expect(settings.isDisplayed()).toBeTruthy();
    var items = clusterSettings.getItems(settings);
    expect(items.count()).toBeGreaterThan(0);
    var item = clusterSettings.getItem(settings, 0);
    expect(item).toBeTruthy();
    expect(item.isDisplayed()).toBeTruthy();
    expect(clusterSettings.isExpired(item)).toBeTruthy();

    expect(clusterSettings.canReconnect(item)).toBeTruthy();
    helpers.resetDate();
    clusterSettings.reconnect(item);

    // Credentials form should be shown
    expect(registration.credentialsForm().isDisplayed()).toBeTruthy();
    expect(registration.connectButton().isEnabled()).toBeFalsy();

    registration.credentialsFormFields().get(1).getAttribute('value').then(function (url) {
      var creds = helpers.getCnsiForUrl(url);
      expect(creds).toBeTruthy();
      registration.fillCredentialsForm(creds.admin.username, creds.admin.password);
      expect(registration.connectButton().isEnabled()).toBeTruthy();
    });

    registration.connectServiceInstance().then(function () {
      helpers.checkAndCloseToast(/Successfully connected to '(?:hcf|hce)'/);
      var item = clusterSettings.getItem(settings, 0);
      expect(clusterSettings.isExpired(item)).toBeFalsy();
    });

  });
});
