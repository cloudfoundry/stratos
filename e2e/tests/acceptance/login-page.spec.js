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

    it('should show the indicator', function () {
      expect(loginPage.contentIndicator().isDisplayed()).toBeTruthy();

      loginPage.contentIndicatorSquares().then(function (squares) {
        expect(squares.length).toBeGreaterThan(0);
      });
    });

    it('should show the next arrow and no previous arrow initially', function () {
      expect(loginPage.nextArrow().isDisplayed()).toBeTruthy();
      expect(loginPage.prevArrow().isDisplayed()).toBeFalsy();
    });

    it('should go to next section if next arrow clicked', function () {
      loginPage.nextArrow().click();

      browser.driver.sleep(1300);
      browser.executeScript('return window.scrollY;').then(function (pos) {
        loginPage.contentSections().get(1).getLocation().then(function (loc) {
          expect(pos).toBe(loc.y);
        });
      });
    });

    it('should go to previous section if previous arrow clicked', function () {
      loginPage.prevArrow().click();

      browser.driver.sleep(1300);
      browser.executeScript('return window.scrollY;').then(function (pos) {
        expect(pos).toBe(0);
      });
    });

    it('should update position of sections on browser width change', function () {
      loginPage.nextArrow().click();

      helpers.setBrowserWidthSmall();
      browser.driver.sleep(1000);

      browser.executeScript('return window.scrollY;').then(function (pos) {
        loginPage.loginPanel().getSize().then(function (size) {
          loginPage.contentSections().get(0).getLocation().then(function (loc) {
            expect(size.height).toBe(loc.y);
          });
        });
      });
    });

    it('should go to section of clicked indicator square', function () {
      loginPage.contentIndicatorSquares().get(0).click();
      browser.driver.sleep(1000);

      browser.executeScript('return window.scrollY;').then(function (pos) {
        expect(pos).toBe(0);
      });

      loginPage.contentIndicatorSquares().get(1).click();
      browser.driver.sleep(1000);

      browser.executeScript('return window.scrollY;').then(function (pos) {
        loginPage.contentSections().get(0).getLocation().then(function (loc) {
          expect(pos).toBe(loc.y);
        });
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
