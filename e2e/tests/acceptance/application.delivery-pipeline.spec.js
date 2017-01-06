/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var application = require('../../po/applications/application.po');
  var deliveryPipeline = require('../../po/applications/application-delivery-pipeline.po');
  var _ = require('../../../tools/node_modules/lodash');
  //var helpers = require('../../po/helpers.po');

  fdescribe('Application Delivery Pipeline', function () {
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

    describe('Delivery Pipeline Tab', function () {
      beforeAll(function () {
        // Delivery Pipeline tab
        application.showDeliveryPipeline();
      });

      it('Should go to delivery pipeline tab', function () {
        expect(application.getActiveTab().getText()).toBe('Delivery Pipeline');
      });

      // Check for text  `You have not set up a delivery pipeline`
      // Check for button
      it('Should not have a pipeline set up', function () {
        var message = deliveryPipeline.getDeliveryPipelineStatusMessage();
        console.log(message)
        expect(message).toBe('You have not set up a delivery pipeline');
        expect(deliveryPipeline.setupPipelineButton().isPresent()).toBe(true);
      });

      // Check for flyout after button press
      // Check that only one entry is shown
      // check that it is selected
      // it('Should show delivery pipeline slide out', function(){
      //
      // })

      // Click next
      // Should have one configured VCS server
      // it('Should show configured VCS servers', function(){
      //
      // })

      // Should show `no token registered` warning
      // Should have `Add new Token` button enabled`
      // it('Should have no token available', function (){
      //
      // })

      // Click `Add new token` button
      // Should show register PAT fly out
      // it('Should show register PAT fly out', function(){
      //
      // })

      // Enter invalid PAT
      // Should show text `Token Value must be a valid GitHub Personal Access Token`
      // Register token should be disabled
      // it('Should show error message on invalid PAT', function(){
      //
      // })

      // Enter valid token
      // Should have VCS server enabled
      // Should have token name under `Token`
      // Should `Manage VCS tokens`
      // it('Should enabled VCS server after registering PAT', function(){
      //
      // })

      // Press Manage VCS token
      // Should show manage VCS token interface
      // Should have registered token available
      // Should have green tick
      // Should have menu
      // Should have rename and delete
      // Should have add new token
      // TODO: This test can be extended
      // it('Should show Manage VCS token interface', function(){
      //
      // })

      // Press Next
      // Should show repositories
      // Select irfanhabib/node-env
      // it('Should show repositories when proceeding', function(){
      //
      // })

      // Press Next
      // Should have node-env selected in the `Repository Selected` field
      // Should show branches
      // Should have refresh button
      // Select `e2e` branch
      // Should show build containers
      // Select NodeJs container
      // Should have hcf selected
      // Eneter name and password
      // Confirm Create Pipelin is enabled
      // it('Should  show repositories when proceeding', function(){
      //
      // })

      // Should have node-env selected in the `Repository Selected` field
      // Should show branches
      // Should have refresh button
      // Select `e2e` branch
      // Should show build containers
      // Select NodeJs container
      // Should have hcf selected
      // Eneter name and password
      // it('Should `create pipeline`', function(){
      //
      // })

      // Press create pipeline
      // Should show notification targets
      // Should have add notification button which all work
      // TODO expand tests
      // it('Should show notification targets', function(){
      //
      // })

      // Press next
      // should show deploy app page
      // should have manifest
      // Should show copy button
      // Press finished code change
      // it('Should show manifest', function(){
      //
      // })

      // Press complete
      // Should be in teh delivery pipeline page
      // should have token name to `E2E-TOKEN`
      // should have repo to `irfanhabib/node-env`
      // should have branch `e2e
      // TODO: furter tests
      // it('Should be in the delivery pipeline page after pipeline creation', function(){
      //
      // })

      // TODO at the end delete pipeline

    });
  });
})();
