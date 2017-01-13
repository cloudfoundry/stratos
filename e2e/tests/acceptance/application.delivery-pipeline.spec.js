/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var appSetupHelper = require('../../po/app-setup.po');
  var galleryWall = require('../../po/applications/applications.po');
  var addAppWizard = require('../../po/applications/add-application-wizard.po');
  var addAppHcfApp = require('../../po/applications/add-application-hcf-app.po');
  var application = require('../../po/applications/application.po');
  var deliveryPipeline = require('../../po/applications/application-delivery-pipeline.po');
  var registerVcsToken = require('../../po/applications/register-vcs-token.po');
  var renameVcsToken = require('../../po/applications/rename-vcs-token.po');
  var manageVcsToken = require('../../po/applications/manage-vcs-token.po');
  var selectRepository = require('../../po/applications/select-repository.po');
  var pipelineDetails = require('../../po/applications/pipeline-details.po');
  var notificationTargetTypes = require('../../po/applications/notifications-target.po');

  var helpers = require('../../po/helpers.po');
  var _ = require('../../../tools/node_modules/lodash');

  describe('Application Delivery Pipeline', function () {
    //var testConfig;
    var testTime = (new Date()).getTime();
    var testAppName = 'acceptance.e2e.' + testTime;

    beforeAll(function () {
      // Setup the test environment.
      // Reset all cnsi that exist in params
      return appSetupHelper.appSetup().then(function () {

        var hostName = testAppName.replace(/\./g, '_');
        galleryWall.showApplications();
        galleryWall.addApplication();
        addAppHcfApp.name().addText(testAppName);
        addAppHcfApp.host().clear();
        addAppHcfApp.host().addText(hostName);
        addAppWizard.getWizard().next();
        helpers.checkAndCloseToast(/application.*created/);
      });
    });

    afterAll(function () {
      return appSetupHelper.deleteAppByName(testAppName)
        .then(function () {
          return appSetupHelper.deletePat(helpers.getGithubTokenName());
        });
    });

    describe('Delivery Pipeline Tab', function () {
      beforeAll(function () {
        // Delivery Pipeline tab
        application.showDeliveryPipeline();
      });

      it('Should go to delivery pipeline tab', function () {
        expect(application.getActiveTab().getText()).toBe('Delivery Pipeline');
      });

      it('Should not have a pipeline set up', function () {
        var message = deliveryPipeline.getDeliveryPipelineStatusMessage();
        expect(message).toBe('You have not set up a delivery pipeline');
        expect(deliveryPipeline.setupPipelineButton().isPresent()).toBe(true);
      });

      function stepCheck(index) {
        expect(deliveryPipeline.getSetupWizard().getCurrentStep().getText())
          .toBe(deliveryPipeline.getSetupWizard().getStepNames()
            .then(function (steps) {
              return steps[index];
            }));
      }

      it('Should show delivery pipeline slide out upon click', function () {
        deliveryPipeline.setupPipelineButton().click();
        expect(deliveryPipeline.getSetupElement().isPresent()).toBe(true);
        expect(deliveryPipeline.getSetupWizard().getTitle()).toBe('Add Pipeline');
        expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);
        stepCheck(0);

      });

      it('Should show configured VCS servers on next step', function () {

        deliveryPipeline.getSetupWizard().next();
        stepCheck(1);

        expect(deliveryPipeline.getVCSServer().isPresent()).toBe(true);
        expect(deliveryPipeline.getVCSServer().getAttribute('class')).toContain('disabled');
        expect(deliveryPipeline.addNewTokenButton().isPresent()).toBe(true);
        expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(false);

      });

      describe('Token management', function () {

        it('Should show register PAT detail view', function () {
          deliveryPipeline.addNewTokenButton().click();
          expect(registerVcsToken.getTokenForm().isPresent()).toBe(true);
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(false);
        });

        it('Should disable form submission with invalid token', function () {
          registerVcsToken.enterToken('test', 'test');
          expect(registerVcsToken.tokenFormFields().get(1).getAttribute('class')).toContain('ng-dirty');
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(false);
        });

        it('Should enable form submission with valid token', function () {
          registerVcsToken.enterToken(helpers.getGithubTokenName(), helpers.getGithubToken());
          expect(registerVcsToken.tokenFormFields().get(1).getAttribute('class')).toContain('ng-valid');
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(true);
        });

        it('Should enable VCS server after registering token', function () {
          registerVcsToken.registerTokenButton().click();
          helpers.checkAndCloseToast(/Personal Access Token .* successfully registered/);
          expect(deliveryPipeline.getVCSServer().getAttribute('class')).not.toContain('disabled');
          expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);
        });

        // Manage VCS tests
        it('should be able to manage VCS tokens', function () {
          expect(deliveryPipeline.manageVcsTokenButton().isPresent()).toBe(true);

          deliveryPipeline.manageVcsTokenButton().click();

          expect(manageVcsToken.getTokensCount()).toBe(1);
          expect(manageVcsToken.isTokenValid(0)).toBe(true);
          expect(manageVcsToken.addNewTokenButton().isPresent()).toBe(true);
          expect(manageVcsToken.getActionsMenu(0).isPresent()).toBe(true);
        });

        it('should be able to add a new token', function () {

          manageVcsToken.addNewTokenButton().click();
          registerVcsToken.enterToken(helpers.getGithubInvalidTokenName(), helpers.getGithubInvalidToken());

          expect(registerVcsToken.tokenFormFields().get(1).getAttribute('class')).toContain('ng-valid');
          expect(registerVcsToken.isRegisterTokenEnabled()).toBe(true);

        });

        it('should have two registered tokens', function () {
          registerVcsToken.registerTokenButton().click();
          helpers.checkAndCloseToast(/Personal Access Token .* successfully registered/);
          // There should be another row for the error case
          expect(manageVcsToken.getTokensCount()).toBe(2);
        });

        it('should have correct connection states', function () {
          // Should be critical
          expect(manageVcsToken.isTokenInvalid(1)).toBe(true);
          // Should be Active
          expect(manageVcsToken.isTokenValid(0)).toBe(true);
        });

        it('should have two operations in the action menu', function () {
          manageVcsToken.clickActionsMenu(1).click();
          expect(manageVcsToken.getActionMenuItems(1).count()).toBe(2);
          expect(manageVcsToken.getActionMenuItemText(1, 0)).toBe('Rename');
          expect(manageVcsToken.getActionMenuItemText(1, 1)).toBe('Delete');
        });

        it('should show confirmation modal when deleting a token', function () {
          manageVcsToken.clickActionMenuItem(1, 1);
          expect(manageVcsToken.isDeleteModalPresent()).toBe(true);

        });

        it('should delete token after confirming model', function () {
          manageVcsToken.confirmModal();
          helpers.checkAndCloseToast(/Personal Access Token .* successfully deleted/);
          expect(manageVcsToken.getTokensCount()).toBe(1);
        });

        it('should show form to rename a token', function () {

          manageVcsToken.clickActionsMenu(0).click();
          manageVcsToken.clickActionMenuItem(0, 0);

          expect(renameVcsToken.getRenameTokenForm().isPresent()).toBe(true);

        });

        it('should disable save if form is invalid', function () {

          renameVcsToken.getRenameTokenFormFields().get(0).clear();
          expect(renameVcsToken.isSaveEnabled()).toBe(false);
        });

        it('should rename successfully with valid information', function () {
          renameVcsToken.enterToken(helpers.getGithubNewTokenName());
          expect(renameVcsToken.isSaveEnabled()).toBe(true);

          renameVcsToken.saveButton().click();

          var toastText = new RegExp("Personal Access Token '[^']+' successfully renamed to '" +
            helpers.getGithubNewTokenName() + "'");
          helpers.checkAndCloseToast(toastText);

          // close manage-vcs screen
          manageVcsToken.doneButton().click();

        });
      });

      it('Should show repositories when proceeding', function () {
        deliveryPipeline.getSetupWizard().next();
        stepCheck(2);

        expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(false);
        selectRepository.enterRepositoryFilter(helpers.getGithubRepository());
        expect(element.all(by.repeater('repo in wizardCtrl.options.displayedRepos')).count()).toBe(1);
      });

      it('Should show pipeline details page when proceeding', function () {
        selectRepository.selectFirstRepository();
        expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);
      });

      describe('Pipeline details', function () {
        it('should not allow user to create pipeline with incorrect data', function () {
          deliveryPipeline.getSetupWizard().next();
          stepCheck(3);

          expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(false);
          var hcfCredentials = helpers.getHcfs().hcf1.admin;
          pipelineDetails.enterPipelineDetails(helpers.getBranchNames(), helpers.getBuildContainer(), hcfCredentials.username, 'foo');
          expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);

          deliveryPipeline.getSetupWizard().next();

          stepCheck(3);
          expect(deliveryPipeline.getSetupWizard().isErrored()).toBe(true);

        });

        it('should allow user to create pipeline with correct data', function () {
          var hcfCredentials = helpers.getHcfs().hcf1.admin;
          pipelineDetails.enterPipelineDetails(helpers.getBranchNames(), helpers.getBuildContainer(), hcfCredentials.username, hcfCredentials.password);
          expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);
        });
      });

      describe('Notification targets tests', function () {

        it('should take user to notification targets page when proceeding', function () {
          deliveryPipeline.getSetupWizard().next();
          stepCheck(4);

          expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);

        });

        it('should contain four target types', function () {
          expect(notificationTargetTypes.getTargetTypes().count()).toBe(4);
        });

        it('should be able to navigate to a specific target type', function () {
          notificationTargetTypes.getTargetTypes()
            .then(function (targetTypes) {
              _.each(targetTypes, function (targetType) {
                notificationTargetTypes.addNewNotificationTarget(targetType).click();
                notificationTargetTypes.cancel().click();
              });
            });
        });
      });

      it('should take user to the manifest page', function () {
        deliveryPipeline.getSetupWizard().next();
        stepCheck(5);
        expect(deliveryPipeline.getSetupWizard().isNextEnabled()).toBe(true);
      });

      it('should have a populated delivery pipeline page', function () {
        deliveryPipeline.getSetupWizard().next();
        expect(application.getActiveTab().getText()).toBe('Delivery Pipeline');
      });

    });
  });
})();
