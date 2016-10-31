'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var gallaryWall = require('../po/applications/applications.po');
var wizard = require('../po/widgets/wizard.po');
var addAppWizard = require('../po/applications/add-application-wizard.po');
var addAppHcfApp = require('../po/applications/add-application-hcf-app.po');
var addAppService = require('../po/applications/add-application-services.po');
var _ = require('../../tools/node_modules/lodash');
var cfModel = require('../po/models/cf-model.po');
var proxyModel = require('../po/models/proxy-model.po');
var Q = require('../../tools/node_modules/q');

describe('Applications - Add application', function () {

  /**
   * This test will create, if missing an e2e org + space then add an application containing a server.
   * Once all tests are finished the app and any related servce, route, etc should be removed. The org + space will
   * remain.
   *
   * THE ORDER OF TESTS IN THIS FILE IS IMPORTANT
   */

  // TODO: App account is non-admin, however every hcf interaction is admin.
  // To fix this need to ensure that the non-admin hcf user gets the correct roles in the new org/space

  var testApp, testService, testCluster, clusterSearchBox, organizationSearchBox, spaceSearchBox, registeredCnsi,
    selectedCluster, selectedOrg, selectedSpace;
  var testOrgName = 'e2e';
  var testSpaceName = 'e2e';
  var testTime = (new Date()).getTime();

  function getSearchBoxes() {
    return element.all(by.css('.panel-body form .form-group'));
  }

  beforeAll(function () {
    // Setup the test environment
    // - The required hcf is registered and connected
    // - The app wall is showing
    // - The app wall has the required hcf, organization and space filters set correctly

    // return browser.driver.wait(resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), true))
    return Q.resolve()
      .then(function () {
        return proxyModel.fetchRegisteredCnsi(null, helpers.getUser(), helpers.getPassword()).then(function (response) {
          registeredCnsi = JSON.parse(response);
          testCluster = _.find(registeredCnsi, {name: helpers.getHcfs().hcf1.register.cnsi_name});
          expect(testCluster).toBeDefined();
          console.log(registeredCnsi);
          console.log(testCluster);
          console.log(helpers.getHcfs().hcf1.register.cnsi_name);
        });
      })
      .then(function () {
        // Add required test organisation if it does not exist
        return cfModel.addOrgIfMissing(testCluster.guid, testOrgName, helpers.getUser(), helpers.getPassword());
      })
      .then(function () {
        // Add required test space if it does not exist
        return cfModel.addSpaceIfMissing(testCluster.guid, testSpaceName, helpers.getUser(), helpers.getPassword());
      })
      .then(function () {
        // Load the browser and navigate to app wall
        helpers.setBrowserNormal();
        helpers.loadApp();
        // Log in as a standard non-admin user
        loginPage.loginAsNonAdmin();
        return gallaryWall.showApplications();
      })
      .then(function () {
        expect(gallaryWall.isApplicationWall()).toBeTruthy();
      })
      .then(function () {
        // Select the required HCF cluster
        clusterSearchBox = searchBox.wrap(getSearchBoxes().get(0));
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
  });

  afterAll(function () {
    if (testApp) {
      cfModel.deleteAppIfExisting(testCluster.guid, testApp.entity.name, helpers.getUser(), helpers.getPassword())
        .catch(function (error) {
          fail('Failed to clean up after running e2e test, there may be a rogue app named: \'' + appName + '\'. Error:', error);
        });
    }
  });

  it('Add Application button should be visible', function () {
    expect(gallaryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
  });

  xit('Add Application button shows fly out with correct values', function () {
    var selectedHcf = _.find(registeredCnsi, {name: selectedCluster});
    var domain = selectedHcf.api_endpoint.Host.substring(4);

    gallaryWall.addApplication().then(function () {
      expect(addAppWizard.isDisplayed()).toBeTruthy();

      expect(wizard.getTitle()).toBe('Add Application');

      wizard.getStepNames().then(function (names) {
        expect(names.length).toBe(3);
      });

      wizard.getStepNames().then(function (steps) {
        expect(steps[0]).toBe('Name');
        expect(steps[1]).toBe('Services');
        expect(steps[2]).toBe('Delivery');
      });

      addAppHcfApp.name().getValue().then(function (text) {
        expect(text).toBe('');
      });

      addAppHcfApp.hcf().getValue().then(function (text) {
        expect(text).toBe(selectedCluster);
      });
      addAppHcfApp.organization().getValue().then(function (text) {
        expect(text).toBe(selectedOrg);
      });
      addAppHcfApp.space().getValue().then(function (text) {
        expect(text).toBe(selectedSpace);
      });

      addAppHcfApp.domain().getValue().then(function (text) {
        expect(text).toBe(domain);
      });
      addAppHcfApp.host().getValue().then(function (text) {
        expect(text).toBe('');
      });

      wizard.isCancelEnabled().then(function (enabled) {
        expect(enabled).toBe(true);
      });

      wizard.isNextEnabled().then(function (enabled) {
        expect(enabled).toBe(false);
      });

    });
  });

  xit('Create hcf app', function () {
    // Should be on the add hcf app step
    expect(wizard.getCurrentStep.getText()).toBe('Name');

    var appName = 'acceptance.e2e.' + testTime;
    var hostName = appName.replace(/\./g, '_');

    addAppHcfApp.name().addText(appName);
    addAppHcfApp.host().getValue().then(function (text) {
      expect(text).toBe(appName);
    });

    wizard.isNextEnabled().then(function (enabled) {
      expect(enabled).toBe(false);
    });

    addAppHcfApp.host().clear();
    addAppHcfApp.host().addText(hostName);

    wizard.isNextEnabled().then(function (enabled) {
      expect(enabled).toBe(true);
    });

    wizard.next();

    cfModel.fetchApp(appName, helpers.getUser(), helpers.getPassword()).then(function (app) {
      testApp = app;
      expect(app).toBeTruthy();
    });
  });

  xit('Add basic service', function () {
    var serviceName = 'acceptance.e2e.service.' + testTime;
    // Should be on the services section of the wizard now
    expect(wizard.getCurrentStep.getText()).toBe('Service');

    // Should be able to skip services, so next should be enabled
    wizard.isNextEnabled().then(function (enabled) {
      expect(enabled).toBe(true);
    });

    // Ensure we have more than one service
    expect(addAppService.getServices().count()).toBeGreaterThan(0);

    // Add the second service
    addAppService.addService(1);

    // Are we on the correct service tab?
    expect(addAppService.getSelectedAddServiceTab()).toBe('I DONT KNOW');

    // Initial save should be disabled
    addAppService.isSaveEnabled().then(function (enabled) {
      expect(enabled).toBe(false);
    });

    // Entering junk should keep the save button disabled
    addAppService.getCreateNewName().addText(serviceName);
    addAppService.isSaveEnabled().then(function (enabled) {
      expect(enabled).toBe(false);
    });

    // Fix the service name
    serviceName = serviceName.replace(/\./g, '_');

    // Enter a valid service name should enable save
    addAppService.getCreateNewName().clear();
    addAppService.getCreateNewName().addText(serviceName);
    addAppService.isSaveEnabled().then(function (enabled) {
      expect(enabled).toBe(true);
    });

    // Save the new service
    addAppService.save();

    // Move passed service screen
    wizard.next();

    cfModel.fetchServiceExist(serviceName, helpers.getUser(), helpers.getPassword()).then(function (service) {
      expect(service).toBeTruthy();
      testService = service;
    });
  });

  xit('Arrive at pipeline section of wizard', function () {
    expect(wizard.getCurrentStep.getText()).toBe('Delivery');
  });

})
;

