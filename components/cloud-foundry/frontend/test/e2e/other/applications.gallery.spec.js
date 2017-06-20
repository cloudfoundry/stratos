(function () {
  'use strict';

  var helpers = require('../../../../app-core/frontend/test/e2e/po/helpers.po');
  // var resetTo = require('../../../../app-core/frontend/test/e2e/po/resets.po');
  // var loginPage = require('../../../../app-core/frontend/test/e2e/po/login-page.po');
  var galleryPage = require('../po/applications/applications.po');

  xdescribe('Applications - Gallery View', function () {
    // beforeAll(function () {
    //   browser.driver.wait(resetTo.removeAllCnsi())
    //     .then(function () {
    //       helpers.setBrowserNormal();
    //       helpers.loadApp();
    //       loginPage.loginAsNonAdmin();
    //     });
    // });

    it('should show applications as cards', function () {
      galleryPage.showApplications();
      expect(browser.getCurrentUrl()).toBe(helpers.getHost() + '/#/cf/applications/list/gallery-view');
      expect(galleryPage.applicationGalleryCards().isDisplayed()).toBeTruthy();
    });

    describe('on card click', function () {
      it('should show application details', function () {
        galleryPage.showApplicationDetails(0);
        expect(browser.getCurrentUrl()).toMatch(/summary$/);
      });
    });
  });
})();
