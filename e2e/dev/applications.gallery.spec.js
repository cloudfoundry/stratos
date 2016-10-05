'use strict';

var helpers = require('../po/helpers.po');
var resetTo = require('../po/resets.po');
var loginPage = require('../po/login-page.po');
var galleryPage = require('../po/applications.po');

xdescribe('Applications - Gallery View', function () {
  beforeAll(function () {
    browser.driver.wait(resetTo.devWorkflow(false))
      .then(function () {
        helpers.setBrowserNormal();
        helpers.loadApp();
        loginPage.login('dev', 'dev');
      });
  });

  it('should show applications as cards', function () {
    galleryPage.showApplications();
    expect(browser.getCurrentUrl()).toBe('http://' + helpers.getHost() + '/#/cf/applications/list/gallery-view');
    expect(galleryPage.applicationGalleryCards().isDisplayed()).toBeTruthy();
  });

  describe('on card click', function () {
    it('should show application details', function () {
      galleryPage.showApplicationDetails(0);
      expect(browser.getCurrentUrl()).toMatch(/summary$/);
    });
  });
});
