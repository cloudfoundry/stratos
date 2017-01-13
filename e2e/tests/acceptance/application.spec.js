(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var application = require('../../po/applications/application.po');
  var _ = require('../../../tools/node_modules/lodash');
  var table = require('../../po/widgets/table.po');
  var addRouteDialog = require('../../po/applications/add-application-route.po');
  var actionMenu = require('../../po/widgets/actions-menu.po');
  var confirmModal = require('../../po/widgets/confirmation-modal.po');
  var editApplicationModal = require('../../po/applications/edit-application.po');

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

      describe('Edit Application', function () {

        var modalTitle = 'Edit App';

        function getMemoryUtilisation() {
          return element(by.css('.summary .row .col-md-6:first-of-type dd:nth-of-type(5)')).getText()
            .then(function (text) {
              var number = text.substring(0, text.indexOf(' '));
              if (text.indexOf('GB') >= 0 || text.indexOf('MB') >= 0) {
                if (text.indexOf('GB') >= 0) {
                  var iNumber = parseInt(number, 10) * 1024;
                  number = iNumber.toString();
                }
              } else {
                fail('Unhandled mem usage size');
              }
              return number;
            });
        }

        function getInstances() {
          return element(by.css('.app-instance-title + dd percent-gauge')).getAttribute('value-text')
            .then(function (text) {
              return text.substring(text.indexOf('/') + 2, text.length);
            });
        }

        it('should open + close + open with initial values', function () {
          var until = protractor.ExpectedConditions;

          // Initial Values - Name
          var originalAppName = application.getHeader().getText();
          expect(originalAppName).toBe(testAppName);

          // Initial Values - Memory Utilisation
          var originalMemUsage = getMemoryUtilisation();

          // Initial Values - Instances
          var originalInstances = getInstances();

          // Open the modal
          application.editApplication();
          browser.wait(until.presenceOf(editApplicationModal.getElement()), 5000);
          expect(editApplicationModal.getTitle()).toBe(modalTitle);

          // Close
          editApplicationModal.cancel();
          browser.wait(until.not(until.presenceOf(editApplicationModal.getElement())), 5000);

          // Open and check values
          application.editApplication();
          browser.wait(until.presenceOf(editApplicationModal.getElement()), 5000);
          expect(editApplicationModal.getTitle()).toBe(modalTitle);

          expect(editApplicationModal.name().getValue()).toBe(originalAppName);
          expect(editApplicationModal.memoryUsage().getValue()).toBe(originalMemUsage);
          expect(editApplicationModal.instances().getValue()).toBe(originalInstances);
        });

        it('should edit values and save changes', function () {
          //Note - depends on open modal from previous test
          expect(editApplicationModal.isDisplayed()).toBe(true);

          var until = protractor.ExpectedConditions;

          // App name
          editApplicationModal.name().clear();
          // Ensure we update the core app name, this will allow app to be deleted at end of test
          testAppName += '-edited';
          var newName = editApplicationModal.name().addText(testAppName).then(function () {
            return testAppName;
          });

          // Mem Usage
          var newMem = editApplicationModal.memoryUsage().getValue().then(function (text) {
            var newValue = parseInt(text, 10) * 2;
            newValue = newValue.toString();
            editApplicationModal.memoryUsage().clear();
            editApplicationModal.memoryUsage().addText(newValue);
            return newValue;
          });

          // Instances
          var newInstance = editApplicationModal.instances().getValue().then(function (text) {
            var newValue = parseInt(text, 10) + 1;
            newValue = newValue.toString();
            editApplicationModal.instances().clear();
            editApplicationModal.instances().addText(newValue);
            return newValue;
          });

          // Input values should be correct
          expect(editApplicationModal.name().getValue()).toBe(newName);
          expect(editApplicationModal.memoryUsage().getValue()).toBe(newMem);
          expect(editApplicationModal.instances().getValue()).toBe(newInstance);

          // Save
          editApplicationModal.save();
          browser.wait(until.not(until.presenceOf(editApplicationModal.getElement())), 5000);

          // App values should be correct
          expect(application.getHeader().getText()).toBe(newName);
          expect(getMemoryUtilisation()).toBe(newMem);
          expect(getInstances()).toBe(newInstance);
        });

      });
    });
  });
})();
