'use strict';

var helpers = require('../../po/helpers.po');
var loginPage = require('../../po/login-page.po');

describe('Login Page', function () {
  beforeAll(function () {
    helpers.setBrowserNormal();
    helpers.loadApp();
  });

  describe('content', function () {
    it('should have at least one section', function () {
      loginPage.contentSections().then(function (sections) {
        expect(sections.length).toBeGreaterThan(0);
      });
    });
  });

  describe('login panel', function () {
    it('should be present', function () {
      expect(loginPage.loginPanel().isDisplayed()).toBeTruthy();
    });

    it('should not show the console-view', function () {
      expect(element(by.css('login-page')).isPresent()).toBeTruthy();
      expect(element(by.css('console-view')).isPresent()).toBeFalsy();
    });

    it('should not allow log in with incorrect credentials', function () {
      helpers.loadApp();
      loginPage.enterLogin('badusername', 'badpassword');

      expect(loginPage.loginButton().isEnabled()).toBeTruthy();

      loginPage.loginButton().click();

      expect(element(by.css('login-page')).isPresent()).toBeTruthy();
      expect(element(by.css('console-view')).isPresent()).toBeFalsy();
    });

    it('should allow log in with correct credentials', function () {
      loginPage.enterLogin(helpers.getUser(), helpers.getPassword());

      expect(loginPage.loginButton().isEnabled()).toBeTruthy();

      loginPage.loginButton().click();

      expect(element(by.css('login-page')).isPresent()).toBeFalsy();
      expect(element(by.css('console-view')).isPresent()).toBeTruthy();
    });
  });

});
