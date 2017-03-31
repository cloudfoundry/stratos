(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    getTokenForm: getTokenForm,
    tokenFormFields: tokenFormFields,
    getGitHubLink: getGitHubLink,
    getGitHubPATLink: getGitHubPATLink,

    isRegisterTokenEnabled: isRegisterTokenEnabled,
    isRegisterTokenView: isRegisterTokenView,

    registerTokenButton: registerTokenButton,
    enterToken: enterToken,
    cancel: cancel
  };

  function getTokenForm() {
    return helpers.getForm('form.registerVcsToken');
  }

  function getGitHubLink() {
    return element(by.css('.register-token-description')).element(by.linkText('Public GitHub.com vcs server'));
  }

  function getGitHubPATLink() {
    return element(by.css('.register-token-description')).element(by.linkText('Personal Access Token'));
  }

  function isRegisterTokenView() {
    return helpers.getForm('form.registerVcsToken').isDisplayed();
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
