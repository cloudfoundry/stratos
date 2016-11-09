(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var credentialsFormHelper = require('../widgets/credentials-form.po');

  module.exports = {

    registrationOverlay: registrationOverlay,
    serviceInstancesTable: serviceInstancesTable,
    connectLink: connectLink,
    disconnectLink: disconnectLink,
    doneButton: doneButton,
    connect: connect,
    disconnect: disconnect,
    completeRegistration: completeRegistration,
    registrationNotification: registrationNotification,
    serviceInstanceStatus: serviceInstanceStatus,

    credentialsForm: credentialsForm,
    credentialsFormFields: credentialsFormFields,
    connectButton: connectButton,
    cancel: cancel,
    fillCredentialsForm: fillCredentialsForm,
    connectServiceInstance: connectServiceInstance
  };

  function registrationOverlay() {
    return element(by.id('registration-overlay')).element(by.css('.service-registration'));
  }

  function serviceInstancesTable() {
    return element(by.css('service-registration')).element(by.css('table'));
  }

  function connectLink(rowIndex) {
    return helpers.getTableRowAt(serviceInstancesTable(), rowIndex)
      .element(by.css('[ng-click="serviceRegistrationCtrl.connect(cnsi)"]'));
  }

  function disconnectLink(rowIndex) {
    return helpers.getTableRowAt(serviceInstancesTable(), rowIndex)
      .element(by.css('[ng-click="serviceRegistrationCtrl.disconnect(serviceRegistrationCtrl.userCnsiModel.serviceInstances[cnsi.guid])"]'));
  }

  function connect(rowIndex) {
    return connectLink(rowIndex).click();
  }

  function disconnect(rowIndex) {
    return disconnectLink(rowIndex).click();
  }

  function doneButton() {
    return registrationOverlay().element(by.css('.fixed-footer button'));
  }

  function completeRegistration() {
    return doneButton().click();
  }

  function serviceInstanceStatus(rowIndex, statusClass) {
    return helpers.getTableCellAt(serviceInstancesTable(), rowIndex, 0)
      .element(by.css('.' + statusClass));
  }

  function registrationNotification() {
    return registrationOverlay().element(by.css('.fixed-footer .registration-notification'));
  }

  function credentialsForm() {
    return credentialsFormHelper.credentialsForm(element(by.id('registration-overlay')).element(by.css('flyout')));
  }

  function credentialsFormFields() {
    return credentialsFormHelper.credentialsFormFields();
  }

  function connectButton() {
    return credentialsFormHelper.connectButton();
  }

  function cancel() {
    return credentialsFormHelper.cancel();
  }

  function fillCredentialsForm(username, password) {
    return credentialsFormHelper.fillCredentialsForm(username, password);
  }

  function connectServiceInstance() {
    return credentialsFormHelper.connect();
  }
})();
