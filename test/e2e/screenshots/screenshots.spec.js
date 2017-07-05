(function () {
  'use strict';

  var components = require('../../../build/components');

  function require_po(component, po) {
    var c = components.getComponents()[component];
    var base = c.frontend && c.frontend.base ? '/' + c.frontend.base : '';
    var path = '../../../components/' + component + base + '/test/e2e/po/' + po;
    return require(path);
  }

  var helpers = require_po('app-core', 'helpers.po');
  var loginPage = require_po('app-core', 'login-page.po');

  describe('Login Page', function () {
    beforeAll(function () {
      helpers.setBrowserNormal();
      helpers.loadApp();
    });

    describe('login panel', function () {
      it('should be present', function () {
        expect(loginPage.loginPanel().isDisplayed()).toBeTruthy();
      });
    });

  });
})();
