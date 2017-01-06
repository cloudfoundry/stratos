/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var application = require('../../po/applications/application.po');
  var _ = require('../../../tools/node_modules/lodash');
  //var helpers = require('../../po/helpers.po');

  describe('Application View', function () {
    //var testConfig;
    var testTime = (new Date()).getTime();
    var testAppName = 'acceptance.e2e.' + testTime;

    beforeAll(function () {
      // Setup the test environment.
      // Reset all cnsi that exist in params
      return appSetupHelper.appSetup().then(function () {
        //testConfig = setup;

        // Create a test app for all of these test to use
        var hostName = testAppName.replace(/\./g, '_');
        var until = protractor.ExpectedConditions;
        galleryWall.showApplications();
        browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
        galleryWall.addApplication();
        browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);
        addAppHcfApp.name().addText(testAppName);
        addAppHcfApp.host().clear();
        addAppHcfApp.host().addText(hostName);
        addAppWizard.getWizard().next();
        return browser.wait(until.not(until.presenceOf(addAppWizard.getElement())), 10000);
      });
    });

    afterAll(function () {
      return appSetupHelper.deleteAppByName(testAppName);
    });

    it('Should Walk through the tabs', function () {
      var names = ['Summary', 'Log Stream', 'Services', 'Delivery Pipeline', 'Delivery Logs', 'Variables', 'Versions'];
      // Walk through each of the tabs
      application.getTabs().then(function (tabs) {
        _.each(tabs, function (tab, i) {
          tab.click();
          expect(application.getActiveTab().getText()).toBe(names[i]);
        });
      });
    });

    describe('Summary Tab', function () {
      beforeAll(function () {
        // Summary tab
        application.showSummary();
      });

      it('Should go to summary tab', function () {
        expect(application.getHeader().isDisplayed()).toBe(true);
        expect(application.getHeader().getText()).toBe(testAppName);
        expect(application.getActiveTab().getText()).toBe('Summary');
      });

      /*
      it('Should create a route', function () {
      });
      */

    });
  });
})();
