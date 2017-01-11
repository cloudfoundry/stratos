(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    getRenameTokenForm: getRenameTokenForm,
    getRenameTokenFormFields: getRenameTokenFormFields,
    saveButton: saveButton,
    cancel: cancel,
    isSaveEnabled: isSaveEnabled,
    enterToken: enterTokenName
  };

  function getRenameTokenForm() {
    return helpers.getForm('form.editVcsToken');
  }

  function getRenameTokenFormFields() {
    return helpers.getFormFields('form.editVcsToken');
  }

  function saveButton() {
    return element(by.css('.btn-commit'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function isSaveEnabled() {
    return helpers.isButtonEnabled(saveButton());
  }

  function enterTokenName(tokenName) {
    var fields = getRenameTokenFormFields();
    fields.get(0).clear();
    return fields.get(0).sendKeys(tokenName);
  }

})();
