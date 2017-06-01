(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppCfApp = require('../../po/applications/add-application-cf-app.po');
  var application = require('../../po/applications/application.po');
  var detailView = require('../../po/widgets/detail-view.po');
  var cfModel = require('../../po/models/cf-model.po');
  var wizard = require('../../po/widgets/wizard.po');
  var table = require('../../po/widgets/table.po');
  var actionMenu = require('../../po/widgets/actions-menu.po');
  var confirmModal = require('../../po/widgets/confirmation-modal.po');
  var helpers = require('../../po/helpers.po');

  describe('Application Delete', function () {
    var testTime = (new Date()).toISOString();
    var testAppName = appSetupHelper.getName(testTime) + '-delete';
    var hostName = appSetupHelper.getHostName(testAppName);
    var testCluster, domain;

    beforeEach(function () {
      // Setup the test environment.
      return appSetupHelper.appSetup().then(function () {
        // Create a test app for all of these test to use
        var until = protractor.ExpectedConditions;
        galleryWall.showApplications();
        browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
        galleryWall.addApplication();
        browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);
        addAppCfApp.name().addText(testAppName);
        addAppCfApp.host().clear();
        addAppCfApp.host().addText(hostName);
        testCluster = appSetupHelper.getTestCluster();
        return addAppCfApp.domain().getValue().then(function (d) {
          domain = d;
          addAppWizard.getWizard().next();
          helpers.checkAndCloseToast("A new application and route have been created for '" + testAppName + "'");
          return browser.wait(until.not(until.presenceOf(addAppWizard.getElement())), 10000);
        });

      });

    });

    afterAll(function () {
      return appSetupHelper.deleteAppByName(testAppName);
    });

    it('Should delete app with routes', function () {
      var until = protractor.ExpectedConditions;

      expect(application.getHeader().getText()).toBe(testAppName);

      application.invokeAction('Delete');
      browser.wait(until.presenceOf(detailView.getElement()), 5000);

      expect(detailView.getTitle()).toBe('Delete App, Pipeline, and Selected Items');
      element.all(by.repeater('route in wizardCtrl.options.safeRoutes')).then(function (rows) {
        expect(rows.length).toEqual(1);
        expect(rows[0].getText()).toMatch(testAppName.replace(/[.:]/g, '_'));
      });

      wizard.next(element(by.css('delete-app-workflow wizard')));
      helpers.checkAndCloseToast("'" + testAppName + "' has been deleted");

      browser.call(function () {
        return cfModel.fetchApp(testCluster.guid, testAppName, helpers.getUser(), helpers.getPassword()).then(function (app) {
          expect(app).toBeNull();
        }).catch(function () {
          fail('Failed to determine if app does not exist');
        });
      });

    });

    it('Should delete app with no routes or services', function () {

      expect(application.getHeader().getText()).toBe(testAppName);

      // Delete the only route
      var routes = table.wrap(element(by.css('.summary-routes table')));
      routes.getData(routes).then(function (rows) {
        expect(rows.length).toBe(1);
        var columnMenu = actionMenu.wrap(routes.getItem(0, 1));
        helpers.scrollIntoView(columnMenu);
        columnMenu.click();
        // Delete
        columnMenu.clickItem(1);

        expect(confirmModal.getTitle()).toBe('Delete Route');
        expect(confirmModal.getBody()).toBe('Are you sure you want to delete ' + hostName + '.' + domain + '?');
        confirmModal.commit();
        helpers.checkAndCloseToast('Route successfully deleted');
      });

      // Delete the app
      application.invokeAction('Delete');

      confirmModal.waitForModal();
      expect(confirmModal.getTitle()).toBe('Delete Application');
      expect(confirmModal.getBody()).toBe('Are you sure you want to delete ' + testAppName + '?');
      confirmModal.commit();
      helpers.checkAndCloseToast("'" + testAppName + "' has been deleted");

      browser.call(function () {
        return cfModel.fetchApp(testCluster.guid, testAppName, helpers.getUser(), helpers.getPassword()).then(function (app) {
          expect(app).toBeNull();
        }).catch(function () {
          fail('Failed to determine if app does not exist');
        });
      });

    });

  });
})();
