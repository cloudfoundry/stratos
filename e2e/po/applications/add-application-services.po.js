'use strict';

var inputText = require('../widgets/input-text.po');
var addAppWizard = require('../applications/add-application-wizard.po');

module.exports = {
  getServices: getServices,
  addService: addService,
  getSelectedAddServiceTab: getSelectedAddServiceTab,
  getCreateNewName: getCreateNewName,
  cancel: cancel,
  isSaveEnabled: isSaveEnabled,
  save: save
};

function getServices() {
  return addAppWizard.getElement().element.all(by.css('.wizard-step service-card'));
}

function addService(index) {
  return getServices.get(index).element(by.css('.btn.btn-sm.btn-link')).click();
}

function getSelectedAddServiceTab() {
  return addAppWizard.getElement().element(by.css('.nav.nav-tabs .active a')).getText();
}

function getCreateNewName() {
  return inputText.wrap(addAppWizard.getElement().element.all(by.css('.tab-pane.active .form-group')).get(0));
}

function cancel() {
  fail('TODO');
}

function isSaveEnabled() {
  fail('TODO');
}

function save() {
  fail('TODO');
}
