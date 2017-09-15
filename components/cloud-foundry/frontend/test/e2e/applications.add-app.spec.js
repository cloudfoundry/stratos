/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var _ = require('lodash');
  var Q = require('q');
  var appSetupHelper = require('./po/app-setup.po');
  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var galleryWall = require('./po/applications/applications.po');
  var addAppWizard = require('./po/applications/add-application-wizard.po');
  var addAppCfApp = require('./po/applications/add-application-cf-app.po');
  var addAppService = require('./po/applications/add-application-services.po');
  var application = require('./po/applications/application.po');
  var cfModel = require('./po/models/cf-model.po');
  var inputText = require('../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var orgsAndSpaces = require('./po/endpoints/endpoints-org-spaces.po');
  var navbar = require('../../../../app-core/frontend/test/e2e/po/navbar.po');
  var table = require('../../../../app-core/frontend/test/e2e/po/widgets/table.po');
  var actionMenu = require('../../../../app-core/frontend/test/e2e/po/widgets/actions-menu.po');
  var confirmModal = require('../../../../app-core/frontend/test/e2e/po/widgets/confirmation-modal.po');
  var cfHelpers = require('./po/helpers.po');

  // Service to use when adding a service to the app
  var SERVICE_NAME = 'app-autoscaler';

  describe('Applications - Add application -', function () {

    /**
     * This spec will ..
     * - Create, if missing, an e2e org + space with roles for admin + non-admin
     * - An application containing a service (but NO pipeline).
     * - Remove the application, if created, and it's associated routes and service instance
     * - Will NOT remove the org + space. This will allow us to see any remaining test artifacts
     *
     * THE ORDER OF TESTS IN THIS FILE IS IMPORTANT
     */

    var testConfig, testApp;
    var testTime = (new Date()).toISOString();
    var appsToDelete = [];

    beforeAll(function () {
      // Setup the test environment.
      // Reset all cnsi that exist in params
      return appSetupHelper.appSetup().then(function (setup) {
        testConfig = setup;
      });
    });

    // Cleanup of test application created by tests
    afterAll(function () {
      // Delete the apps at the end of all of the tests
      return Q.all(_.map(appsToDelete, function (appName) {
        return appSetupHelper.deleteApp(appName);
      }));
    });

    beforeEach(function () {
      testApp = undefined;
    });

    afterEach(function () {
      if (testApp) {
        appsToDelete.push(testApp);
      }
    });

    it('Add Application button should be visible', function () {
      expect(galleryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
    });

    it('Add Application button shows fly out with correct values', function () {
      galleryWall.addApplication().then(function () {
        expect(addAppWizard.isDisplayed()).toBeTruthy();

        expect(addAppWizard.getTitle()).toBe('Add Application');

        addAppCfApp.name().getValue().then(function (text) {
          expect(text).toBe('');
        });

        addAppCfApp.cf().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedCluster);
        });
        addAppCfApp.organization().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedOrg);
        });
        addAppCfApp.space().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedSpace);
        });

        addAppCfApp.host().getValue().then(function (text) {
          expect(text).toBe('');
        });

        addAppWizard.getWizard().isCancelEnabled().then(function (enabled) {
          expect(enabled).toBe(true);
        });

        addAppWizard.getWizard().isNextEnabled().then(function (enabled) {
          expect(enabled).toBe(false);
        });

        // Need to close the wizard
        addAppWizard.getWizard().cancel();
      });
    });

    it('Create cf app - test', function () {

      var appName = appSetupHelper.getName(testTime);
      var hostName = appSetupHelper.getHostName(appName);
      var serviceName = appSetupHelper.getServiceName(testTime);
      var until = protractor.ExpectedConditions;

      //browser.driver.wait(protractor.until.elementIsVisible(galleryWall.getAddApplicationButton(), 5000));
      //browser.driver.wait(protractor.until.elementIsEnabled(galleryWall.getAddApplicationButton(), 5000));
      browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
      galleryWall.addApplication();

      expect(addAppWizard.isDisplayed()).toBeTruthy();
      expect(addAppWizard.getTitle()).toBe('Add Application');

      browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);

      // Wait until form control is available
      browser.wait(until.presenceOf(addAppWizard.getElement()), 15000);

      addAppCfApp.name().addText(appName);
      expect(addAppCfApp.host().getValue()).toBe(appName);

      expect(addAppWizard.getWizard().isNextEnabled()).toBe(false);
      addAppCfApp.host().clear();
      addAppCfApp.host().addText(hostName);
      expect(addAppWizard.getWizard().isNextEnabled()).toBe(true);

      addAppWizard.getWizard().next();
      helpers.checkAndCloseToast(/A new application and route have been created for '[^']+'/).then(function () {
        return cfModel.fetchApp(testConfig.testCluster.guid, appName, helpers.getUser(), helpers.getPassword())
          .then(function (app) {
            testApp = app;
            expect(app).toBeTruthy();
          })
          .catch(function () {
            fail('Failed to determine if app exists');
          });
      });

      // Wait for dialog to close
      browser.wait(until.not(until.presenceOf(addAppWizard.getElement())), 10000);

      // Should now have reached the application page
      expect(application.getHeaderAppName().isDisplayed()).toBe(true);
      expect(application.getHeaderAppName().getText()).toBe(appName);
      expect(application.getActiveTab().getText()).toBe('Summary');
      expect(application.isIncomplete()).toBe(true);
      expect(application.isNewlyCreated()).toBe(true);

      expect(element(by.id('new-app-add-services')).isDisplayed()).toBe(true);
      element(by.id('new-app-add-services')).click();
      expect(application.getActiveTab().getText()).toBe('Service Catalog');

      browser.wait(until.presenceOf(element(by.css('service-catalogue-card'))), 10000);

      addAppService.addService(SERVICE_NAME);

      var serviceWizard = addAppService.getServiceWizard();
      expect(serviceWizard.getWizard().isCancelEnabled()).toBe(true);
      expect(serviceWizard.getWizard().isNextEnabled()).toBe(false);

      expect(serviceWizard.getSelectedAddServiceTab()).toBe('Create New Instance');
      serviceWizard.getCreateNewName().addText(serviceName);
      expect(serviceWizard.getWizard().isNextEnabled()).toBe(false);

      serviceName = appSetupHelper.getServiceName(testTime, true);
      serviceWizard.getCreateNewName().clear();
      serviceWizard.getCreateNewName().addText(serviceName);
      expect(serviceWizard.getWizard().isNextEnabled()).toBe(true);

      serviceWizard.getWizard().next();
      expect(serviceWizard.getWizard().getNext().getText()).toBe('DONE');
      serviceWizard.getWizard().next().then(function () {
        cfModel.fetchServiceExist(testConfig.testCluster.guid, serviceName, helpers.getUser(), helpers.getPassword())
          .then(function (service) {
            expect(service).toBeTruthy();
          })
          .catch(function () {
            fail('Failed to determine if service exists');
          });
      });

      application.showSummary();
      // Check that we now have a bound service instance
      var servicesCount = element(by.css('.app-summary-bound-services-count'));
      expect(servicesCount.getText()).toBe('1');

      // Test that the service is shown on the Service Instance tab
      expect(application.findServiceInstanceCard(serviceName)).toBeDefined();

      // Test CLI Info
      application.invokeAction('CLI Info');

      // cf push acceptance.e2e.1484149644648
      // Check copy to clipboard
      element.all(by.css('code-block .console-copy')).get(3).click();
      element(by.css('button.close')).click();

      galleryWall.showApplications();

      // Check that the text from the CLI Instructions was copied to the clipboard
      galleryWall.addApplication();
      expect(addAppCfApp.name().getValue()).toBe('');
      var inputField = element(by.id('add-app-workflow-application-name'));
      inputField.click();
      inputField.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'v'));
      expect(addAppCfApp.name().getValue()).toBe('cf push ' + appName);

      addAppWizard.getWizard().cancel();
      galleryWall.showApplications();
    });

    it('Should show add application button when no applications shown on app wall', function () {
      galleryWall.showApplications();
      galleryWall.resetFilters();
      galleryWall.getAddAppWhenNoApps().isPresent().then(function (present) {
        if (!present) {
          // Type some stuff in the search box that will result in no matching applications
          var appNameSearchBox = inputText.wrap(galleryWall.appNameSearch());
          appNameSearchBox.clear();
          return appNameSearchBox.addText('zzz_not_expecting_any_apps');
        }
      });
      galleryWall.getAddAppWhenNoApps().click();
      expect(addAppWizard.isDisplayed()).toBeTruthy();
      expect(addAppWizard.getTitle()).toBe('Add Application');
      addAppWizard.getWizard().cancel();
    });

    describe('check application on the cf endpoints dashboard -', function () {

      beforeAll(function () {
        // Load the app again - keep the cookies so we don't have to login
        // This is a workaround for a Bug
        helpers.loadApp(true);
        navbar.goToView('endpoint.clusters');

        var cfFromConfig = cfHelpers.getCfs() ? cfHelpers.getCfs().cf1 : {};
        orgsAndSpaces.goToOrg(cfFromConfig.testOrgName || 'e2e');
        orgsAndSpaces.goToSpace(cfFromConfig.testSpaceName || 'e2e');
      });

      it('should show the org/space view and its tabs', function () {
        // Walk through each of the tabs on the space page
        application.getTabs().then(function (tabs) {
          _.each(tabs, function (tab) {
            tab.click();
          });
        });
      });
    });
  }).skipWhen(helpers.skipIfNoCF);
})();
