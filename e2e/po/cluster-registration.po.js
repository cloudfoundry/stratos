'use strict';

// Cluster registration helpers
var helpers = require('./helpers.po');
var hostIp = helpers.getHost();
var addClusterFormName = 'addClusterFormCtrl.addClusterForm';

module.exports = {

  registrationOverlay: registrationOverlay,
  clusterMessageBox: clusterMessageBox,
  clusterTable: clusterTable,
  clusterTableRows: clusterTableRows,
  addClusterFromMessageBox: addClusterFromMessageBox,
  addClusterFromTable: addClusterFromTable,
  removeClusterButton: removeClusterButton,
  removeClusterFromTable: removeClusterFromTable,

  addClusterForm: addClusterForm,
  addClusterFormFields: addClusterFormFields,
  fillAddClusterForm: fillAddClusterForm,
  registerButton: registerButton,
  cancel: cancel,
  registerCluster: registerCluster

};

function registrationOverlay() {
  return element(by.id('cluster-registration-overlay'));
}

function clusterMessageBox() {
  return registrationOverlay().element(by.css('.message-box'));
}

function clusterTable() {
  return registrationOverlay().element(by.css('cluster-registration-list'))
    .element(by.css('table'));
}

function clusterTableRows() {
  return clusterTable().all(by.css('tbody tr[ng-repeat]'));
}

function addClusterFromMessageBox() {
  clusterMessageBox().element(by.buttonText('Add Cluster')).click();
  browser.driver.sleep(1000);
}

function addClusterFromTable() {
  clusterTable().element(by.buttonText('Add Cluster')).click();
  browser.driver.sleep(1000);
}

function removeClusterButton(index) {
  return clusterTableRows().get(index).element(by.buttonText('remove'));
}

function removeClusterFromTable(index) {
  removeClusterButton(index).click();
}

/**
 * Add Cluster Form page objects
 */
function addClusterForm() {
  return registrationOverlay().element(by.css('flyout'))
    .element(by.css('form[name="' + addClusterFormName + '"]'));
}

function addClusterFormFields() {
  return helpers.getFormFields(addClusterFormName);
}

function registerButton() {
  return helpers.getForm(addClusterFormName)
    .element(by.buttonText('Register'));
}

function cancel() {
  helpers.getForm(addClusterFormName)
    .element(by.buttonText('Cancel')).click();
  browser.driver.sleep(1000);
}

function fillAddClusterForm(address, name) {
  var fields = helpers.getFormFields(addClusterFormName);
  fields.get(0).clear();
  fields.get(1).clear();
  fields.get(0).sendKeys(address || '');
  fields.get(1).sendKeys(name || '');
}

function registerCluster() {
  registerButton().click();
}
