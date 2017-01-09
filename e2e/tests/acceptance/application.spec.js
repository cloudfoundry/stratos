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
  var table = require('../../po/widgets/table.po');
  var addRouteDialog = require('../../po/applications/add-application-route.po');
  var actionMenu = require('../../po/widgets/actions-menu.po');
  var confirmModal = require('../../po/widgets/confirmation-modal.po');

  describe('Application View', function () {
    //var testConfig;
    var testTime = (new Date()).getTime();
    var testAppName = 'acceptance.e2e.' + testTime;
    var hostName = testAppName.replace(/\./g, '_');
    var newHostName = hostName + '_new';
    var domain;

    beforeAll(function () {
      // Setup the test environment.
      // Reset all cnsi that exist in params
      return appSetupHelper.appSetup().then(function () {
        //testConfig = setup;

        // Create a test app for all of these test to use
        var until = protractor.ExpectedConditions;
        galleryWall.showApplications();
        browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
        galleryWall.addApplication();
        browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);
        addAppHcfApp.name().addText(testAppName);
        addAppHcfApp.host().clear();
        addAppHcfApp.host().addText(hostName);
        return addAppHcfApp.domain().getValue().then(function (d) {
          domain = d;
          addAppWizard.getWizard().next();
          return browser.wait(until.not(until.presenceOf(addAppWizard.getElement())), 10000);
        });
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

      describe('Route Management', function () {

        it('Should list current route', function () {
          var route = hostName + '.' + domain;
          // Application should only have a single route
          var routes = table.wrap(element(by.css('.summary-routes table')));
          routes.getData(routes).then(function (rows) {
            expect(rows.length).toBe(1);
            expect(rows[0][0]).toBe(route);
          });
        });

        it('should be able to add a route', function () {
          var until = protractor.ExpectedConditions;
          var route = hostName + '.' + domain;
          var newRoute = newHostName + '.' + domain;
          application.addRoute();

          expect(addRouteDialog.getTitle()).toBe('Add a Route');
          expect(addRouteDialog.isDisplayed()).toBe(true);
          addRouteDialog.cancel();
          browser.wait(until.not(until.presenceOf(addRouteDialog.getElement())), 5000);
          application.addRoute();
          expect(addRouteDialog.isDisplayed()).toBe(true);
          expect(addRouteDialog.getTitle()).toBe('Add a Route');
          addRouteDialog.host().clear();
          addRouteDialog.host().addText(newHostName);
          addRouteDialog.commit();
          browser.wait(until.not(until.presenceOf(addRouteDialog.getElement())), 5000);

          // Should have two routes now
          var routes = table.wrap(element(by.css('.summary-routes table')));
          routes.getData(routes).then(function (rows) {
            expect(rows.length).toBe(2);
            expect(rows[0][0]).toBe(route);
            expect(rows[1][0]).toBe(newRoute);
          });
        });

        it('should be able to delete a route', function () {
          // This assumes that the previous test has run and created a route
          var routes = table.wrap(element(by.css('.summary-routes table')));
          routes.getData(routes).then(function (rows) {
            expect(rows.length).toBe(2);
            var columnMenu = actionMenu.wrap(routes.getItem(0,1));
            columnMenu.click();
            // Delete
            columnMenu.clickItem(1);

            expect(confirmModal.getTitle()).toBe('Delete Route');
            expect(confirmModal.getBody()).toBe('Are you sure you want to delete ' + hostName + '.' + domain + '?');
            confirmModal.commit();

            routes.getData(routes).then(function (newRows) {
              expect(newRows.length).toBe(1);
              expect(newRows[0][0]).toBe(newHostName + '.' + domain);
            });
          });
        });
      });
    });
  });
})();
