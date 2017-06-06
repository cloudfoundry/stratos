(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var inputText = require('../../po/widgets/input-text.po');
  var inputSelect = require('../../po/widgets/input-select-input.po');

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
    inputSelect.selectOptionByLabel(element(by.css('.organizations-drop-down select-input')), orgName);

    var spaceNameField = inputText.wrap(element(by.name('name0')));
    spaceNameField.addText(spaceName);
    element(by.buttonText('Create')).click();
    helpers.checkAndCloseToast(/Space '.*' successfully created/);
  }

  function assignUsers() {
    throw String('Not implemented');
  }

})();

