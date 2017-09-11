(function () {
  'use strict';

  var _ = require('lodash');
  var appSetupHelper = require('./po/app-setup.po');
  var galleryWall = require('./po/applications/applications.po');
  var addAppWizard = require('./po/applications/add-application-wizard.po');
  var addAppCfApp = require('./po/applications/add-application-cf-app.po');
  var application = require('./po/applications/application.po');
  var table = require('../../../../app-core/frontend/test/e2e/po/widgets/table.po');
  var addRouteDialog = require('./po/applications/add-application-route.po');
  var actionMenu = require('../../../../app-core/frontend/test/e2e/po/widgets/actions-menu.po');
  var confirmModal = require('../../../../app-core/frontend/test/e2e/po/widgets/confirmation-modal.po');
  var editApplicationModal = require('./po/applications/edit-application.po');
  var navbar = require('../../../../app-core/frontend/test/e2e/po/navbar.po');
  var orgsAndSpaces = require('./po/endpoints/endpoints-org-spaces.po');
  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var cfHelpers = require('./po/helpers.po');

  describe('Application View', function () {
    //var testConfig;
    var testTime = (new Date()).toISOString();
    var testAppName = appSetupHelper.getName(testTime);
    var hostName = appSetupHelper.getHostName(testAppName);
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
        addAppCfApp.name().addText(testAppName);
        addAppCfApp.host().clear();
        addAppCfApp.host().addText(hostName);
        return addAppCfApp.domain().getValue().then(function (d) {
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
      var names = ['Summary', 'Log Stream', 'Services', 'Variables', 'Events', 'SSH'];
      var cfFromConfig = cfHelpers.getCfs() ? cfHelpers.getCfs().cf1 : undefined;
      if (cfFromConfig && cfFromConfig.supportsVersions) {
        names.push('Versions');
      }
      browser.debugger();
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
        expect(application.getHeaderAppName().isDisplayed()).toBe(true);
        expect(application.getHeaderAppName().getText()).toBe(testAppName);
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
            var columnMenu = actionMenu.wrap(routes.getItem(0, 1));
            helpers.scrollIntoView(columnMenu);
            columnMenu.click();
            // Delete
            columnMenu.clickItem(1);

            expect(confirmModal.getTitle()).toBe('Delete Route');
            expect(confirmModal.getBody()).toBe("Are you sure you want to delete '" + hostName + '.' + domain + "'?");
            confirmModal.commit();

            routes.getData(routes).then(function (newRows) {
              expect(newRows.length).toBe(1);
              expect(newRows[0][0]).toBe(newHostName + '.' + domain);
            });
          });
        });

        describe('Application route should show up on CF Endpoints view', function () {

          var appRouteName, appViewUrl;

          beforeAll(function () {
            // NOTE - Requires route with name <newHostName> create from test above
            appRouteName = newHostName + '.' + domain;

            browser.getCurrentUrl().then(function (url) {
              appViewUrl = url;
            });
            helpers.loadApp(true);
            navbar.goToView('endpoint.clusters');
            orgsAndSpaces.goToOrg('e2e');
            orgsAndSpaces.goToSpace('e2e');
            // Go to Routes tab
            application.getTabs().get(2).click();
          });

          // After all tests have run, return to the app view page
          afterAll(function () {
            return browser.get(appViewUrl);
          });

          it('routes table should include our app route', function () {
            // Note: Even though its routes, the class is services
            var routes = table.wrap(element(by.css('.space-services-table table')));
            routes.getRows().then(function (rows) {
              expect(rows.length).toBeGreaterThan(0);
            });
            // Table should contain our route
            routes.getData().then(function (rows) {
              var index = _.findIndex(rows, function (row) {
                return row[0] === appRouteName;
              });
              expect(index).not.toBeLessThan(0);
            });
          });

          it('should allow the route to be un-mapped and then deleted', function () {
            var routes = table.wrap(element(by.css('.space-services-table table')));
            routes.waitForElement();

            // Click the "Show More" button in case there are many routes
            var showMoreButtonLink = element(by.css('.space-services-table tfoot > tr > td > a'));
            showMoreButtonLink.isDisplayed().then(function (visible) {
              if (visible) {
                showMoreButtonLink.click();
              }
            });

            routes.getData().then(function (rows) {
              var index = _.findIndex(rows, function (row) {
                return row[0] === appRouteName;
              });

              // Confirm route exists in table
              expect(index).not.toBeLessThan(0);
              expect(rows[index]).toBeDefined();

              // Confirm route is attached to an application
              var appRouteAttachedTo = rows[index][1];
              expect(appRouteAttachedTo).toBeDefined();
              expect(appRouteAttachedTo.length).toBeGreaterThan(0);
              expect(appRouteAttachedTo, testAppName);

              var columnMenu = actionMenu.wrap(routes.getItem(index, 2));
              columnMenu.waitForElement();

              // Unmap Route
              columnMenu.click();
              columnMenu.clickItem(1);
              confirmModal.waitForModal();
              expect(confirmModal.getTitle()).toBe('Unmap Route from Application');
              confirmModal.commit();
              confirmModal.waitUntilNotPresent();

              // Delete Route
              columnMenu.click();
              columnMenu.clickItem(0);
              confirmModal.waitForModal();
              expect(confirmModal.getTitle()).toBe('Delete Route');
              confirmModal.commit();
              confirmModal.waitUntilNotPresent();

              if (rows.length === 1) {
                expect(element(by.css('.space-services-table .panel-body')).getText()).toBe('You have no routes');
              } else {
                routes.getData().then(function (newRows) {
                  expect(newRows.length).toBe(rows.length - 1);
                });
              }
            });
          });
        });
      });

      describe('Edit Application', function () {

        var modalTitle = 'Edit App';

        function getMemoryUtilisation() {
          return element(by.id('app-memory-value')).getText()
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
          var originalAppName = application.getHeaderAppName().getText();
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
          expect(application.getHeaderAppName().getText()).toBe(newName);
          expect(getMemoryUtilisation()).toBe(newMem);
          expect(getInstances()).toBe(newInstance);
        });

      });

    });
  }).skipWhen(helpers.skipIfNoCF);
})();
