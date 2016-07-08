'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var endpointsDashboardPage = require('../po/endpoints-dashboard.po.js');

describe('Endpoints Dashboard', function () {

  describe('No clusters', function () {

    beforeAll(function () {
      browser.driver.wait(resetTo.zeroClusterAdminWorkflow())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
        });
    });

    it('should show welcome endpoints page', function () {
      endpointsDashboardPage.showEndpoints();
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/endpoints-dashboard');
      expect(endpointsDashboardPage.welcomeMessage().isDisplayed()).toBeTruthy();
      expect(endpointsDashboardPage.registerCloudFoundryTile().isDisplayed()).toBeTruthy();
      expect(endpointsDashboardPage.registerCodeEngineTile().isDisplayed()).toBeTruthy();
    });

    it('should show add cluster form flyout when btn is pressed', function () {
      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.clickAddClusterInWelcomeMessage('hcf');
      expect(endpointsDashboardPage.getAddClusterForm().isDisplayed()).toBeTruthy();
    });

    it('should show add cluster form detail view when btn is pressed', function () {
      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.clickAddClusterInWelcomeMessage('hce');
      expect(endpointsDashboardPage.getAddEndpointFlyout().isDisplayed()).toBeTruthy();
    });

    it('should show add cluster form detail view when tile btn is pressed', function () {
      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.clickAddClusterInTille('hcf');
      expect(endpointsDashboardPage.getAddClusterForm().isDisplayed()).toBeTruthy();
    });

    it('should show add cluster form detail view when tile btn is pressed', function () {
      endpointsDashboardPage.showEndpoints();
      endpointsDashboardPage.clickAddClusterInTille('hce');
      expect(endpointsDashboardPage.getAddEndpointFlyout().isDisplayed()).toBeTruthy();
    });

  });

  describe('With clusters', function () {

    beforeAll(function () {
      browser.driver.wait(resetTo.nClustersAdminWorkflow())
        .then(function () {
          helpers.setBrowserNormal();
          helpers.loadApp();
          loginPage.loginAsAdmin();
        });
    });

    it('should show welcome endpoints page', function () {
      endpointsDashboardPage.showEndpoints();
      expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/endpoints-dashboard');
      expect(endpointsDashboardPage.welcomeMessage().isDisplayed()).toBeFalsy();
      expect(endpointsDashboardPage.registerCloudFoundryTile().isDisplayed()).toBeFalsy();
      expect(endpointsDashboardPage.registerCodeEngineTile().isDisplayed()).toBeFalsy();
    });

  });

});
