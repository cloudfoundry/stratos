/* eslint-disable angular/json-functions,angular/log,no-console */
(function () {
  'use strict';

  var helpers = require('./helpers.po');
  var resetTo = require('./resets.po');
  var loginPage = require('./login-page.po');
  var galleryWall = require('./applications/applications.po');
  var _ = require('../../tools/node_modules/lodash');
  var cfModel = require('./models/cf-model.po');
  var vcsModel = require('./models/vcs-model.po');
  var proxyModel = require('./models/proxy-model.po');
  var searchBox = require('./widgets/input-search-box.po');

  module.exports = {
    appSetup: appSetup,
    deleteApp: deleteApp,
    deleteAppByName: deleteAppByName,
    getTestCluster: getTestCluster,
    deletePat: deletePat
  };

  var testCluster, testOrgName, testSpaceName, testUser, testAdminUser, clusterSearchBox,
    organizationSearchBox, spaceSearchBox, registeredCnsi, selectedCluster, selectedOrg, selectedSpace, appSetupPromise, testHceCluster;
  var hcfFromConfig = helpers.getHcfs() ? helpers.getHcfs().hcf1 : undefined;
  var hceFromConfig = helpers.getHces() ? helpers.getHces().hce1 : undefined;

  function getSearchBoxes() {
    return element.all(by.css('.application-cf-filters .form-group'));
  }

  function deleteApp(testApp) {
    if (testApp) {
      var promise = cfModel.deleteAppIfExisting(testCluster.guid, null, testApp.entity.name, helpers.getUser(), helpers.getPassword())
        .catch(function (error) {
          fail('Failed to clean up after running e2e test, there may be a rogue app named: \'' + (testApp.entity.name || 'unknown') + '\'. Error:', error);
        });
      return browser.driver.wait(promise);
    }
  }

  function deleteAppByName(appName) {
    if (appName) {
      var promise = cfModel.deleteAppIfExisting(testCluster.guid, testHceCluster.guid, appName, helpers.getUser(), helpers.getPassword())
        .catch(function (error) {
          fail('Failed to clean up after running e2e test, there may be a rogue app named: \'' + (appName || 'unknown') + '\'. Error:', error);
        });
      return browser.driver.wait(promise);
    }
  }

  function deletePat(patName) {
    var promise = vcsModel.deletePat(patName)
      .catch(function (error) {
        fail('Failed to clean up after running e2e test, there will be a token named: ' + patName + ', Error: ' + error);
      });
    return browser.driver.wait(promise);
  }

  function getTestCluster() {
    return testCluster;
  }

  function createAppSetupPromise() {
    // Setup the test environment. This will ensure....
    // - The required hcf is registered and connected (for both admin and non-admin users)
    // - The app wall is showing
    // - The app wall has the required hcf, organization and space filters set correctly

    // Reset all cnsi that exist in params
    return resetTo.resetAllCnsi()
      .then(function () {
        // Connect the test non-admin user to all cnsis in params
        return resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false);
      })
      .then(function () {
        // Connect the test admin user to all cnsis in params (required to ensure correct permissions are set when
        // creating orgs + spaces)
        return resetTo.connectAllCnsi(helpers.getAdminUser(), helpers.getAdminPassword(), true);
      })
      .then(function () {
        // Fetch the e2e org and space names
        testOrgName = hcfFromConfig.testOrgName;
        testSpaceName = hcfFromConfig.testSpaceName;
        expect(testOrgName).toBeDefined();
        expect(testSpaceName).toBeDefined();
        // Fetch the cnsi metadata
        return proxyModel.fetchRegisteredCnsi(null, helpers.getUser(), helpers.getPassword()).then(function (response) {
          registeredCnsi = JSON.parse(response);
          testCluster = _.find(registeredCnsi, {name: hcfFromConfig.register.cnsi_name});
          // HCE can be optional
          testHceCluster = hceFromConfig ? _.find(registeredCnsi, {name: hceFromConfig.register.cnsi_name}) : undefined;
          expect(testCluster).toBeDefined();
        });
      })
      .then(function () {
        // Set up/find the required organization and space
        // Fetch the hcf admin + non-admin user guids. This will be used for org + space roles
        return cfModel.fetchUsers(testCluster.guid)
          .then(function (users) {
            testUser = _.find(users, {entity: {username: hcfFromConfig.user.username}});
            testAdminUser = _.find(users, {entity: {username: hcfFromConfig.admin.username}});
            expect(testUser).toBeDefined();
            expect(testAdminUser).toBeDefined();
          }).then(function () {
            // Add required test organisation if it does not exist
            // POSSIBLE IMPROVEMENT - Ensure both admin + non-admin have correct roles
            return cfModel.addOrgIfMissing(testCluster.guid, testOrgName, testAdminUser.metadata.guid,
              testUser.metadata.guid);
          })
          .then(function (organization) {
            // Add required test space if it does not exist
            // POSSIBLE IMPROVEMENT - Ensure both admin + non-admin have correct roles
            return cfModel.addSpaceIfMissing(testCluster.guid, organization.metadata.guid, testOrgName, testSpaceName,
              testAdminUser.metadata.guid, testUser.metadata.guid);
          });
      })
      .then(function () {
        // Load the browser and navigate to app wall
        helpers.setBrowserNormal();
        helpers.loadApp();
        // Log in as a standard non-admin user
        loginPage.loginAsNonAdmin();
        return galleryWall.showApplications();
      })
      .then(function () {
        expect(galleryWall.isApplicationWall()).toBeTruthy();
      })
      .then(function () {
        // Select the required HCF cluster
        clusterSearchBox = searchBox.wrap(getSearchBoxes().get(0));
        expect(clusterSearchBox.isDisplayed()).toBe(true);
        expect(clusterSearchBox).toBeDefined();
        expect(clusterSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return clusterSearchBox.selectOptionByLabel(testCluster.name);
      })
      .then(function () {
        // Get the selected cluster
        return clusterSearchBox.getValue().then(function (text) {
          selectedCluster = text;
          expect(selectedCluster).toEqual(testCluster.name);
        });
      })
      .then(function () {
        // Select the required e2e organization
        organizationSearchBox = searchBox.wrap(getSearchBoxes().get(1));
        expect(organizationSearchBox).toBeDefined();
        expect(organizationSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return organizationSearchBox.selectOptionByLabel(testOrgName);
      })
      .then(function () {
        // Get the selected organization
        return organizationSearchBox.getValue().then(function (text) {
          selectedOrg = text;
          expect(selectedOrg).toEqual(testOrgName);
        });
      })
      .then(function () {
        // Select the required e2e space
        spaceSearchBox = searchBox.wrap(getSearchBoxes().get(2));
        expect(spaceSearchBox).toBeDefined();
        expect(spaceSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return spaceSearchBox.selectOptionByLabel(testSpaceName);
      })
      .then(function () {
        // Get the selected space
        return spaceSearchBox.getValue().then(function (text) {
          selectedSpace = text;
          expect(selectedSpace).toEqual(testSpaceName);
        });
      });
  }

  function appSetup() {
    // Lazyily initialize the promise
    if (!appSetupPromise) {
      appSetupPromise = createAppSetupPromise();
    }

    // Ensure we don't continue until everything is set up
    return browser.driver.wait(appSetupPromise).then(function () {
      return {
        testCluster: testCluster,
        registeredCnsi: registeredCnsi,
        selectedCluster: selectedCluster,
        selectedOrg: selectedOrg,
        selectedSpace: selectedSpace
      };
    });
  }
})();
