'use strict';

// Service instances registration helpers
var helpers = require('./helpers.po');
var loginPage = require('./login-page.po');
var navbar = require('./navbar.po');

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

  loginAndConnect: loginAndConnect,
  disconnectAndLogout: disconnectAndLogout

};

function registrationOverlay() {
  return element(by.id('registration-overlay')).element(by.css('.service-registration'));
}

function serviceInstancesTable() {
  return element(by.css('service-registration')).element(by.css('table'));
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

function loginAndConnect() {
  loginPage.login();
  browser.driver.sleep(1000);
  connect(0);
  doneButton().click();
}

function disconnectAndLogout() {
  navbar.showAccountSettings();
  browser.driver.sleep(1000);
  disconnect(0);
  navbar.logout();
}
