'use strict';

// Service instances registration helpers
var helpers = require('./helpers.po');
var loginPage = require('./login-page.po');

module.exports = {

  login: login,
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

  credentialsFlyout: credentialsFlyout,
  credentialsForm: credentialsForm,
  credentialsFormFields: credentialsFormFields,
  cancelButton: cancelButton,
  registerButton: registerButton,
  passwordEye: passwordEye,
  cancel: cancel,
  register: register,
  togglePassword: togglePassword

};

function login() {
  var fields = loginPage.loginFormFields();
  fields.get(0).sendKeys('dev');
  fields.get(1).sendKeys('dev');
  loginPage.loginButton().click();
}

function registrationOverlay() {
  return element(by.id('registration-overlay')).element(by.css('.service-registration'));
}

function serviceInstancesTable() {
  return registrationOverlay().element(by.css('table'));
}

function connectLink(rowIndex) {
  return helpers.getTableRowAt(serviceInstancesTable(), rowIndex)
    .element(by.css('[ng-click="serviceRegistrationCtrl.connect(serviceInstance)"]'));
}

function disconnectLink(rowIndex) {
  return helpers.getTableRowAt(serviceInstancesTable(), rowIndex)
    .element(by.css('[ng-click="serviceRegistrationCtrl.disconnect(serviceInstance)"]'));
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

function credentialsFlyout() {
  return registrationOverlay().element(by.css('.flyout-content'));
}

function credentialsForm() {
  return helpers.getForm('credentialsFormCtrl.credentialsForm');
}

function credentialsFormFields() {
  return helpers.getFormFields('credentialsFormCtrl.credentialsForm');
}

function cancelButton() {
  return credentialsForm().element(by.css('[ng-click="credentialsFormCtrl.cancel()"]'));
}

function registerButton() {
  return credentialsForm().element(by.css('button[type="submit"]'));
}

function cancel() {
  return cancelButton().click();
}

function register() {
  return registerButton().click();
}

function passwordEye() {
  return credentialsForm().element(by.css('.password-reveal'));
}

function togglePassword() {
  return passwordEye().click();
}
