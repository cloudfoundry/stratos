(function () {
  'use strict';

  // Service instances registration helpers
  var helpers = require('../helpers.po');
  var credentialsFormName = 'credentialsFormCtrl.credentialsForm';

  module.exports = {

    credentialsForm: credentialsForm,
    credentialsFormFields: credentialsFormFields,
    connectButton: connectButton,
    cancel: cancel,
    fillCredentialsForm: fillCredentialsForm,
    connect: connect
  };

  function credentialsForm(aParentElement) {
    return aParentElement ? aParentElement.element(by.css('form[name="' + credentialsFormName + '"]'))
      : element(by.css('form[name="' + credentialsFormName + '"]'));
  }

  function credentialsFormFields() {
    return helpers.getFormFields(credentialsFormName);
  }

  function connectButton() {
    return helpers.getForm(credentialsFormName)
      .element(by.buttonText('Connect'));
  }

  function cancel() {
    helpers.getForm(credentialsFormName)
      .element(by.buttonText('Cancel')).click();
  }

  function fillCredentialsForm(username, password) {
    var fields = credentialsFormFields();
    fields.get(2).clear();
    fields.get(3).clear();
    fields.get(2).sendKeys(username || '');
    fields.get(3).sendKeys(password || '');
  }

  function connect() {
    return connectButton().click();
  }
})();
