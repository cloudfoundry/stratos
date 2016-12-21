(function () {
  'use strict';

  // Login page helpers
  var helpers = require('./helpers.po');

  module.exports = {

    enterLogin: enterLogin,
    login: login,
    loginAsAdmin: loginAsAdmin,
    loginAsNonAdmin: loginAsNonAdmin,
    loginButton: loginButton,
    loginFormFields: loginFormFields,
    loginPanel: loginPanel

  };

  function loginPanel() {
    return element(by.id('section-login-panel'));
  }

  function loginFormFields() {
    return helpers.getFormFields('loginForm');
  }

  function loginButton() {
    return helpers.getForm('loginForm').element(by.css('button[type="submit"]'));
  }

  function enterLogin(username, password) {
    var fields = loginFormFields();
    fields.get(0).clear();
    fields.get(1).clear();
    fields.get(0).sendKeys(username);
    return fields.get(1).sendKeys(password);
  }

  function login(username, password) {
    return enterLogin(username, password).then(function () {
      return loginButton().click();
    });
  }

  function loginAsAdmin() {
    return login(helpers.getAdminUser(), helpers.getAdminPassword());
  }

  function loginAsNonAdmin() {
    return login(helpers.getUser(), helpers.getPassword());
  }
})();
