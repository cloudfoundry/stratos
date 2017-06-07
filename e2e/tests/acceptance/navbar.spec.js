/* eslint-disable angular/json-functions */
(function () {
  'use strict';

  var helpers = require('../../po/helpers.po');
  var navBar = require('../../po/navbar.po');
  var appWallConfig500 = require('../../client/e2e/app-wall/500-apps.js');
  var ngMockE2E = require('../../po/ng-mock-e2e.po');

  describe('Application Navigation Bar', function () {

    beforeAll(function () {
      ngMockE2E.init();
      // Configure HTTP responses for all wall with 500 apps
      appWallConfig500(ngMockE2E.$httpBackend);
      helpers.setBrowserNormal();
      helpers.loadApp();
    });

    afterEach(function () {
      navBar.setLabelsShown();
    });

    afterAll(function () {
      navBar.setLabelsShown();
      ngMockE2E.unload();
    });

    it('Should show labels by default', function () {
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
      helpers.loadApp();
      expect(navBar.isIconsOnly()).toBe(true);
    });
  });
})();
