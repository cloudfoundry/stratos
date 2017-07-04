(function () {
  'use strict';

  var helpers = require('../../../../../../app-core/frontend/test/e2e/po/helpers.po');
  var inputText = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var inputSelect = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-select-input.po');

  module.exports = {
    createOrganisation: createOrganisation,
    createSpace: createSpace,
    assignUsers: assignUsers
  };

  function createOrganisation(orgName) {
    element(by.buttonText('Create Organization')).click();
    var orgNameField = inputText.wrap(element(by.name('form.createOrganization')));
    orgNameField.addText(orgName);
    element(by.buttonText('Create')).click();
    helpers.checkAndCloseToast(/Organisation '.*' successfully created/);
  }

  function createSpace(orgName, spaceName) {
    element(by.buttonText('Create Space')).click();
    inputSelect.selectOptionByLabel(element(by.css('.organizations-drop-down')), orgName);

    var spaceNameField = inputText.wrap(element(by.repeater('space in asyncTaskDialogCtrl.context.data.spaces track by $index')));
    spaceNameField.addText(spaceName);
    element(by.buttonText('Create')).click();
    helpers.checkAndCloseToast(/Space '.*' successfully created/);
  }

  function assignUsers() {
    throw String('Not implemented');
  }

})();

