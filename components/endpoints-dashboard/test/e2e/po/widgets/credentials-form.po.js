(function () {
  'use strict';

  var appCore = '../../../../../app-core/frontend/';

  // Service instances registration helpers
  var helpers = require(appCore + 'test/e2e/po/helpers.po');
  var asyncDialog = require(appCore + 'test/e2e/po/widgets/async-dialog.po');
  var credentialsFormName = 'form.registerCnsi';

  module.exports = {

    credentialsForm: credentialsForm,
    credentialsFormFields: credentialsFormFields,
    credentialsFormConnectButton: connectButton,
    credentialsFormCancel: cancel,
    credentialsFormFill: fillCredentialsForm,
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
    return asyncDialog.getCommit();
  }

  function cancel() {
    asyncDialog.cancel();
  }

  function fillCredentialsForm(username, password) {
    var fields = credentialsFormFields();
    fields.get(2).clear();
    fields.get(3).clear();
    fields.get(2).sendKeys(username || '');
    fields.get(3).sendKeys(password || '');
  }

  function connect() {
    return asyncDialog.commit();
  }
})();
