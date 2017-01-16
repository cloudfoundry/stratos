(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    getForm: getForm,
    getFormFields: getFormFields,
    getStormRunnerAccountLink: getStormRunnerAccountLink,

    isAddActionEnabled: isAddActionEnabled,

    addAction: addAction,
    enterPostDeployDetails: enterPostDeployDetails,
    cancel: cancel
  };

  function getForm() {
    return helpers.getForm('form.postDeployForm');
  }

  function getFormFields() {
    return helpers.getFormFields('form.postDeployForm');
  }

  function getStormRunnerAccountLink() {
    return element(by.css('.desc-box')).element(by.linkText('Storm Runner Account'));
  }

  function addAction() {
    return element(by.css('.btn-commit'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function isAddActionEnabled() {
    return helpers.isButtonEnabled(addAction());
  }

  function enterPostDeployDetails(actionName, userName, password, tenantId, stormRunnerProjectId, testId) {
    var fields = getFormFields();
    fields.get(0).sendKeys(actionName);
    fields.get(1).sendKeys(userName);
    fields.get(2).sendKeys(password);
    fields.get(3).sendKeys(tenantId);
    fields.get(4).sendKeys(stormRunnerProjectId);
    return fields.get(5).sendKeys(testId);
  }

})();
