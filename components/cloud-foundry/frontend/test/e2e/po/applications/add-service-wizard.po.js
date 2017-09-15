(function () {
  'use strict';

  var inputText = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var wizard = require('../../../../../../app-core/frontend/test/e2e/po/widgets/wizard.po');
  var asyncDialog = require('../../../../../../app-core/frontend/test/e2e/po/widgets/async-dialog-view.po');

  module.exports = {
    getElement: getElement,
    getCreateNewName: getCreateNewName,
    getWizard: getWizard,
    getDialog: getDialog
  };

  function getElement() {
    return element(by.css('.add-service-workflow'));
  }

  function getCreateNewName() {
    return inputText.wrap(getDialogElement().all(by.css('form .form-group')).get(0));
  }

  function getWizard() {
    return wizard.wrap(getElement());
  }

  function getDialogElement() {
    return element(by.css('.modal.create-service-instance-dialog'));
  }

  function getDialog() {
    return asyncDialog.wrap(getDialogElement());
  }
})();
