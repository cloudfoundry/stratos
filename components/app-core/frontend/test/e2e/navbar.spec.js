/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var helpers = require('./po/helpers.po');
  var navBar = require('./po/navbar.po');
  var loginPage = require('./po/login-page.po');

  describe('Application Navigation Bar', function () {

    beforeEach(function () {
      // Load the browser and navigate to app wall
      helpers.setBrowserNormal();
      helpers.loadApp();
      // Log in as a standard non-admin user
      loginPage.loginAsNonAdmin();
    });

    afterEach(function () {
      navBar.setLabelsShown();
    });

    afterAll(function () {
      navBar.setLabelsShown();
    });

    it('Should show labels by default', function () {
      browser.driver.sleep(5000);
      expect(navBar.isIconsOnly()).toBe(false);
    });

    it('Should allow changing to the icons only view', function () {
      expect(navBar.isIconsOnly()).toBe(false);
      navBar.toggleNavBar();
      expect(navBar.isIconsOnly()).toBe(true);
    });

    it('Should remember the menu state across reloads', function () {
      expect(navBar.isIconsOnly()).toBe(false);
      navBar.toggleNavBar();
      expect(navBar.isIconsOnly()).toBe(true);
      helpers.loadApp(true);
      expect(navBar.isIconsOnly()).toBe(true);
    });
  });
})();
