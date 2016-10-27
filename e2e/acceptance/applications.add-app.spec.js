'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var endpointsDashboardPage = require('../po/endpoints/endpoints-dashboard.po');
var registerEndpoint = require('../po/endpoints/register-endpoint.po');
var gallaryWall = require('../po/applications/applications.po');
var wizard = require('../po/widgets/wizard.po');
var addAppWizard = require('../po/applications/add-application-wizard.po');
var searchBox = require('../po/widgets/input-search-box.po');
var _ = require('../../tools/node_modules/lodash');

fdescribe('Applications - Add application', function () {

  // The ORDER of when this test runs is IMPORTANT. Depends on endpoints-dashboard running first, which will register
  // and connect HCF and HCE instances. To divorce these we just need to create a 'resetAndConnect' style function
  // in resets.po

  // The ORDER of tests in this file is IMPORTANT.

  // Need to have at least one connected HCF with at least one organization and one space

  function getSearchBoxes() {
    return element.all(by.css('.panel-body form .form-group'));
  }

  var clusterSearchBox, organizationSearchBox, spaceSearchBox, registeredCnsi, selectedCluster, selectedOrg, selectedSpace;

  beforeAll(function () {
    // Connect to all cnsi as a standard non-admin user
    return browser.driver.wait(resetTo.connectAllCnsi(helpers.getUser(), helpers.getPassword(), false))
      .then(function () {
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
        clusterSearchBox = searchBox.wrap(getSearchBoxes().get(0));
        expect(clusterSearchBox).toBeDefined();
        expect(clusterSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return clusterSearchBox.selectOption(1);
      })
      .then(function () {
        return clusterSearchBox.getValue().then(function (text) {
          selectedCluster = text;
        });
      })
      .then(function () {
        organizationSearchBox = searchBox.wrap(getSearchBoxes().get(1));
        expect(organizationSearchBox).toBeDefined();
        expect(organizationSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return organizationSearchBox.selectOption(1);
      })
      .then(function () {
        return organizationSearchBox.getValue().then(function (text) {
          selectedOrg = text;
        });
      })
      .then(function () {
        spaceSearchBox = searchBox.wrap(getSearchBoxes().get(2));
        expect(spaceSearchBox).toBeDefined();
        expect(spaceSearchBox.getOptionsCount()).toBeGreaterThan(1);
        return spaceSearchBox.selectOption(1);
      })
      .then(function () {
        return spaceSearchBox.getValue().then(function (text) {
          selectedSpace = text;
        });
      })
      .then(function () {
        return resetTo.fetchRegisteredCnsi().then(function (response) {
          registeredCnsi = JSON.parse(response);
        });
      });
  });

  afterAll(function () {
    //TODO: RC
    console.log('TODO!! TIDY UP');
  });

  it('Add Application button should be visible', function () {
    expect(gallaryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
  });

  it('Add Application button shows fly out with correct values', function () {
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

      addAppWizard.name().getValue().then(function (text) {
        expect(text).toBe('');
      });

      addAppWizard.hcf().getValue().then(function (text) {
        expect(text).toBe(selectedCluster);
      });
      addAppWizard.organization().getValue().then(function (text) {
        expect(text).toBe(selectedOrg);
      });
      addAppWizard.space().getValue().then(function (text) {
        expect(text).toBe(selectedSpace);
      });

      addAppWizard.domain().getValue().then(function (text) {
        expect(text).toBe(domain);
      });
      addAppWizard.host().getValue().then(function (text) {
        expect(text).toBe('');
      });

      addAppWizard.isCancelEnabled().then(function (enabled) {
        expect(enabled).toBe(true);
      });

      addAppWizard.isNextEnabled().then(function (enabled) {
        expect(enabled).toBe(false);
      });

    });
  });

  var appName;

  it('Add basic app', function () {
    var epochTime = (new Date()).getTime();
    appName = 'acceptance.e2e.' + epochTime;
    var hostName = appName.replace(/\./g, '_');

    addAppWizard.name().addText(appName);
    addAppWizard.host().getValue().then(function (text) {
      expect(text).toBe(appName);
    });

    addAppWizard.isNextEnabled().then(function (enabled) {
      expect(enabled).toBe(false);
    });

    addAppWizard.host().clear();
    addAppWizard.host().addText(hostName);

    addAppWizard.isNextEnabled().then(function (enabled) {
      expect(enabled).toBe(true);
    });

    addAppWizard.next();

    //TODO: RC App exists?

  });

})
;

