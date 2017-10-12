(function () {
  'use strict';

  var helpers = require('./po/helpers.po');
  var appSetup = require('./po/app-setup.po');

  var runSetupModeTests = false;
  describe('Console Setup', function () {

    beforeAll(function (done) {

      helpers.setBrowserNormal();
      helpers.loadApp();
      helpers.isSetupMode()
        .then(function () {
          runSetupModeTests = true;
          done();
        }, function () {
          runSetupModeTests = false;
          done();
        });
    });

    afterAll(function () {});

    it('Should be in setup mode', function () {
      if (runSetupModeTests) {
        expect(helpers.isSetupMode()).toBeTruthy();
      }
    });

    it('Should show `Introduction` page', function () {
      if (runSetupModeTests) {

        expect(appSetup.getStepTitle().getText()).toBe('Introduction');
      }
    });

    it('Next should be enabled', function () {
      if (runSetupModeTests) {

        expect(appSetup.getWizard().isBackEnabled()).toBe(false);
        expect(appSetup.getWizard().isNextEnabled()).toBe(true);
        appSetup.getWizard().next();
      }
    });

    it('Should show `UAA Endpoint` page', function () {
      if (runSetupModeTests) {

        expect(appSetup.getStepTitle().getText()).toBe('UAA Endpoint');
      }
    });

    it('Next button should be disabled', function () {
      if (runSetupModeTests) {

        expect(appSetup.getWizard().isBackEnabled()).toBe(true);
        expect(appSetup.getWizard().isNextEnabled()).toBe(false);
      }
    });

    it('Correct details should enable next button', function () {
      if (runSetupModeTests) {

        appSetup.uaaApiUrl().addText(helpers.getUaaConfig().apiUrl);
        appSetup.setSkipSllValidation(true);
        appSetup.clientId().addText(helpers.getUaaConfig().clientId);
        appSetup.adminUserName().addText(helpers.getUaaConfig().adminUsername);
        appSetup.adminPassword().addText(helpers.getUaaConfig().adminPassword);
        expect(appSetup.getWizard().isNextEnabled()).toBe(true);
      }
    });

    it('Should show `Console Admin Scope` page after pressing next', function () {
      if (runSetupModeTests) {

        appSetup.getWizard().next();
        browser.driver.sleep(1000);
        expect(appSetup.getStepTitle().getText()).toBe('Console Admin Scope');
      }
    });

    it('`stratos.admin` should be displayed in search box', function () {
      if (runSetupModeTests) {
        expect(appSetup.scopeSearchBox().getValue()).toBe('stratos.admin');
        expect(appSetup.getWizard().isNextEnabled()).toBe(true);
        appSetup.getWizard().next();
        browser.sleep(5000);
      }
    });

    it('Should display login page', function () {
      if (runSetupModeTests) {
        it('should be present', function () {
          expect(loginPage.loginPanel().isDisplayed()).toBeTruthy();
        });
      }
    });
  }).skipWhen(!helpers.getRunSetupModeTests);
})();
