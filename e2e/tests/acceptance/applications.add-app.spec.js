/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var helpers = require('../../po/helpers.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var addAppService = require('../../po/applications/add-application-services.po');
  var application = require('../../po/applications/application.po');
  var deliveryPipeline = require('../../po/applications/application-delivery-pipeline.po');
  var _ = require('../../../tools/node_modules/lodash');
  var cfModel = require('../../po/models/cf-model.po');
  var inputText = require('../../po/widgets/input-text.po');

  describe('Applications - Add application', function () {

    /**
     * This spec will ..
     * - Create, if missing, an e2e org + space with roles for admin + non-admin
     * - An application containing a service (but NO pipeline).
     * - Remove the application, if created, and it associated routes and service instance
     * - Will NOT remove the org + space. This will allow us to see any remaining test artifacts
     *
     * THE ORDER OF TESTS IN THIS FILE IS IMPORTANT
     */

    var testConfig, testApp;
    var testTime = (new Date()).getTime();

    beforeAll(function () {
      // Setup the test environment.
      // Reset all cnsi that exist in params
      return appSetupHelper.appSetup().then(function (setup) {
        testConfig = setup;
      });
    });

    // Cleanup of test application created by tests
    beforeEach(function () {
      testApp = undefined;
    });

    afterEach(function () {
      return appSetupHelper.deleteApp(testApp);
    });

    it('Add Application button should be visible', function () {
      expect(galleryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
    });

    it('Add Application button shows fly out with correct values', function () {
      var selectedHcf = _.find(testConfig.registeredCnsi, {name: testConfig.selectedCluster});
      var domain = selectedHcf.api_endpoint.Host.substring(4);

      galleryWall.addApplication().then(function () {
        expect(addAppWizard.isDisplayed()).toBeTruthy();

        expect(addAppWizard.getTitle()).toBe('Add Application');

        addAppHcfApp.name().getValue().then(function (text) {
          expect(text).toBe('');
        });

        addAppHcfApp.hcf().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedCluster);
        });
        addAppHcfApp.organization().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedOrg);
        });
        addAppHcfApp.space().getValue().then(function (text) {
          expect(text).toBe(testConfig.selectedSpace);
        });

        addAppHcfApp.domain().getValue().then(function (text) {
          expect(text).toBe(domain);
        });
        addAppHcfApp.host().getValue().then(function (text) {
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

    it('Create hcf app - test', function () {

      var appName = 'acceptance.e2e.' + testTime;
      var hostName = appName.replace(/\./g, '_');
      var serviceName = 'acceptance.e2e.service.' + testTime;
      var until = protractor.ExpectedConditions;

      //browser.driver.wait(protractor.until.elementIsVisible(galleryWall.getAddApplicationButton(), 5000));
      //browser.driver.wait(protractor.until.elementIsEnabled(galleryWall.getAddApplicationButton(), 5000));
      browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
      galleryWall.addApplication();

      expect(addAppWizard.isDisplayed()).toBeTruthy();
      expect(addAppWizard.getTitle()).toBe('Add Application');

      //browser.wait(until.visibilityOf(addAppHcfApp.name()), 5000);
      browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);

      // Wait until form control is available
      browser.wait(until.presenceOf(addAppWizard.getElement()), 15000);

      addAppHcfApp.name().addText(appName);
      expect(addAppHcfApp.host().getValue()).toBe(appName);

      expect(addAppWizard.getWizard().isNextEnabled()).toBe(false);
      addAppHcfApp.host().clear();
      addAppHcfApp.host().addText(hostName);
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
      expect(application.getHeader().isDisplayed()).toBe(true);
      expect(application.getHeader().getText()).toBe(appName);
      expect(application.getActiveTab().getText()).toBe('Summary');
      expect(application.isIncomplete()).toBe(true);
      expect(application.isNewlyCreated()).toBe(true);

      expect(element(by.id('new-app-add-services')).isDisplayed()).toBe(true);
      element(by.id('new-app-add-services')).click();
      expect(application.getActiveTab().getText()).toBe('Services');

      browser.wait(until.presenceOf(element(by.css('service-card'))), 10000);

      element.all(by.css('service-card .service-actions button.btn.btn-link')).then(function (addServiceButtons) {
        expect(addServiceButtons.length).toBeGreaterThan(0);
        addServiceButtons[0].click();

        var serviceWizard = addAppService.getServiceWizard();
        expect(serviceWizard.getWizard().isCancelEnabled()).toBe(true);
        expect(serviceWizard.getWizard().isNextEnabled()).toBe(false);

        expect(serviceWizard.getSelectedAddServiceTab()).toBe('Create New Instance');
        serviceWizard.getCreateNewName().addText(serviceName);
        expect(serviceWizard.getWizard().isNextEnabled()).toBe(false);

        serviceName = serviceName.replace(/\./g, '_');
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
      });

      // Go to the delivery pipeline tab
      application.showDeliveryPipeline();
      expect(application.getActiveTab().getText()).toBe('Delivery Pipeline');
      expect(deliveryPipeline.setupPipelineButton().isPresent()).toBe(true);
      deliveryPipeline.setupPipelineButton().click();
      expect(deliveryPipeline.getSetupElement().isPresent()).toBe(true);
      expect(deliveryPipeline.getSetupWizard().getTitle()).toBe('Add Pipeline');
      deliveryPipeline.getSetupWizard().cancel();

      application.showSummary();
      application.invokeAction('CLI Instructions');

      // cf push acceptance.e2e.1484149644648
      // Check copy to clipboard
      element.all(by.css('code-block .hpe-copy')).get(2).click();
      element(by.css('button.close')).click();

      galleryWall.showApplications();

      // Check that the text from the CLI Instructions was copied to the clipboard
      galleryWall.addApplication();
      expect(addAppHcfApp.name().getValue()).toBe('');
      var inputField = element(by.id('add-app-workflow-application-name'));
      inputField.click();
      inputField.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'v'));
      expect(addAppHcfApp.name().getValue()).toBe('cf push ' + appName);

      addAppWizard.getWizard().cancel();
      galleryWall.showApplications();
    });

    it('Create an application and allow user to choose to setup a pipeline', function () {
      var appName = 'acceptance.e2e.' + testTime + '_2';
      var hostName = appName.replace(/\./g, '_');
      var until = protractor.ExpectedConditions;
      browser.wait(until.presenceOf(galleryWall.getAddApplicationButton()), 15000);
      galleryWall.addApplication();

      expect(addAppWizard.isDisplayed()).toBeTruthy();
      browser.wait(until.presenceOf(addAppWizard.getWizard().getNext()), 5000);
      // Wait until form control is available
      browser.wait(until.presenceOf(addAppWizard.getElement()), 15000);
      addAppHcfApp.name().addText(appName);
      addAppHcfApp.host().clear();
      addAppHcfApp.host().addText(hostName);
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
      expect(application.getHeader().isDisplayed()).toBe(true);
      expect(application.isNewlyCreated()).toBe(true);

      // Pipeline
      expect(element(by.id('new-app-setup-pipeline')).isDisplayed()).toBe(true);
      element(by.id('new-app-setup-pipeline')).click();
      expect(application.getActiveTab().getText()).toBe('Delivery Pipeline');
      expect(deliveryPipeline.getSetupElement().isPresent()).toBe(true);
      expect(deliveryPipeline.getSetupWizard().getTitle()).toBe('Add Pipeline');
      deliveryPipeline.getSetupWizard().cancel();

      // Back to app wall when we are done
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

  });
})();
