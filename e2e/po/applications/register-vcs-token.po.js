(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    getTokenForm: getTokenForm,
    tokenFormFields: tokenFormFields,
    registerTokenButton: registerTokenButton,
    cancel: cancel,
    isRegisterTokenEnabled: isRegisterTokenEnabled,
    enterToken: enterToken
  };

  function getTokenForm() {
    return helpers.getForm('form.registerVcsToken');
  }

  function tokenFormFields() {
    return helpers.getFormFields('form.registerVcsToken');
  }

  function registerTokenButton() {
    return element(by.css('.btn-commit'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function isRegisterTokenEnabled() {
    return helpers.isButtonEnabled(registerTokenButton());
  }

  function enterToken(tokenName, token) {
    var fields = tokenFormFields();
    fields.get(0).clear();
    fields.get(1).clear();
    fields.get(0).sendKeys(tokenName);
    return fields.get(1).sendKeys(token);
  }


})();
