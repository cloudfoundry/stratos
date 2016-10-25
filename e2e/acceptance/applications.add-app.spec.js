'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var endpointsDashboardPage = require('../po/endpoints/endpoints-dashboard.po');
var registerEndpoint = require('../po/endpoints/register-endpoint.po');
var gallaryWall = require('../po/applications/applications.po');
var wizard = require('../po/widgets/wizard.po');
var addAppWizard = require('../po/applications/add-application-wizard.po');

fdescribe('Applications - Add application', function () {

  // The ORDER of when this test runs is IMPORTANT. Depends on endpoints-dashboard running first, which will register
  // and connect HCF and HCE instances. To divorce these we just need to create a 'resetAndConnect' style function
  // in resets.po

  // The ORDER of tests in this file is IMPORTANT.

  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
    loginPage.loginAsNonAdmin();
    galleryPage.showApplications();
    expect(gallaryWall.isApplicationWall()).toBeTruth();
  });

  it('Add Application button should be visible', function () {
    expect(gallaryWall.getAddApplicationButton().isDisplayed()).toBeTruthy();
  });

  it('Add Application button shows fly out with correct values', function () {
    var hcfName = '???';
    var selectedOrg = '???';
    var selectedSpace = '???';
    var domain = '???';

    gallaryWall.addApplication().then(function () {
      expect(addAppWizard.isVisible()).toBeTruthy();

      expect(wizard.getTitle()).toBe('Add Application');
      expect(wizard.getStepNames().length).toBe(3);
      wizard.getStepNames().then(function (steps) {
        expect(steps[0]).toBe('Name');
        expect(steps[1]).toBe('Services');
        expect(steps[2]).toBe('Deploy App');
      });

      expect(addAppWizard.name().value).toBe('');
      expect(addAppWizard.hcf().value).toBe(hcfName);
      expect(addAppWizard.organization().value).toBe(selectedOrg);
      expect(addAppWizard.space().value).toBe(selectedSpace);
      expect(addAppWizard.domain().value).toBe(domain);
      expect(addAppWizard.host().value).toBe('');

    });
  });

});

