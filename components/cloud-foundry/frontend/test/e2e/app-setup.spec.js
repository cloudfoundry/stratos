(function () {
  'use strict';

  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  var appSetup = require('./po/applications/app-setup.po');

  var apiUrl = 'http://10.84.93.122:8080';
  var clientId = 'console';
  var adminUsername = 'admin';
  var adminPassword = 'hscadmin';
  fdescribe('Console Setup', function () {

    beforeAll(function () {
      helpers.setBrowserNormal();
      helpers.loadApp();
    });

    afterAll(function () {});

    it('Should be in setup mode', function () {
      expect(helpers.isSetupMode()).toBeTruthy();
    });

    it('Should show `Introduction` page', function () {
      expect(appSetup.getStepTitle().getText()).toBe('Introduction');
    });

    it('Next should be enabled', function () {
      expect(appSetup.getWizard().isBackEnabled()).toBe(false);
      expect(appSetup.getWizard().isNextEnabled()).toBe(true);
      appSetup.getWizard().next();
    });

    it('Should show `UAA Endpoint` page', function () {
      expect(appSetup.getStepTitle().getText()).toBe('UAA Endpoint');
    });

    it('Next button should be disabled', function () {
      expect(appSetup.getWizard().isBackEnabled()).toBe(true);
      expect(appSetup.getWizard().isNextEnabled()).toBe(false);
    });

    it('Correct details should enable next button', function () {
      appSetup.uaaApiUrl().addText(apiUrl);
      appSetup.setSkipSllValidation(true);
      appSetup.clientId().addText(clientId);
      appSetup.adminUserName().addText(adminUsername);
      appSetup.adminPassword().addText(adminPassword);
      expect(appSetup.getWizard().isNextEnabled()).toBe(true);
    });

    it('Should show `Console Admin Scope` page after pressing next', function () {
      appSetup.getWizard().next();
      browser.driver.sleep(1000);
      expect(appSetup.getStepTitle().getText()).toBe('Console Admin Scope');
    });

    it('`stratos.admin` should be displayed in search box', function () {
      expect(appSetup.scopeSearchBox().getValue()).toBe('stratos.admin');
      expect(appSetup.getWizard().isNextEnabled()).toBe(true);
      appSetup.getWizard().next();
    });
  });
})();
