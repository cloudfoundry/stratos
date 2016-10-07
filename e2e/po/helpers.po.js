'use strict';

var sh = require('../../tools/node_modules/shelljs');

// Get host IP
var CMD = "/sbin/ip route|awk '/default/ { print $3 }'";
var hostProtocol = browser.params.hostProtocol || 'https://';
var hostIp = browser.params.hostIp || sh.exec(CMD, { silent: true }).output.trim();
var hostPort = browser.params.port || '';
var host = hostProtocol + hostIp + (hostPort ? ':' + hostPort : '');

var cnsis = browser.params.cnsi;
var hcfs = cnsis.hcf;
var hces = cnsis.hce;
var adminUser = browser.params.credentials.admin.username || 'admin@cnap.local';
var adminPassword = browser.params.credentials.admin.password || 'cnapadmin';
var user = browser.params.credentials.user.username || 'user@cnap.local';
var password = browser.params.credentials.user.password || 'cnapuser';

module.exports = {

  getHost: getHost,
  getCNSIs: getCNSIs,
  getHcfs: getHcfs,
  getHces: getHces,
  getAdminUser: getAdminUser,
  getAdminPassword: getAdminPassword,
  getUser: getUser,
  getPassword: getPassword,

  newBrowser: newBrowser,
  loadApp: loadApp,
  setBrowserNormal: setBrowserNormal,
  setBrowserSmall: setBrowserSmall,
  setBrowserWidthSmall: setBrowserWidthSmall,

  getForm: getForm,
  getFormFields: getFormFields,
  getFormField: getFormField,
  getAttribute: getAttribute,
  getFieldType: getFieldType,

  getTableRows: getTableRows,
  getTableRowAt: getTableRowAt,
  getTableCellAt: getTableCellAt,

  closeFlyout: closeFlyout

};

function getHost() {
  return host;
}

function getCNSIs() {
  return cnsis;
}

function getHcfs() {
  return hcfs;
}

function getHces() {
  return hces;
}

function getAdminUser() {
  return adminUser;
}

function getAdminPassword() {
  return adminPassword;
}

function getUser() {
  return user;
}

function getPassword() {
  return password;
}

function newBrowser() {
  return browser.forkNewDriverInstance(true);
}

function loadApp() {
  browser.manage().deleteAllCookies();
  browser.get(host);
}

function setBrowserNormal() {
  browser.manage().window().setSize(1024, 768);
}

function setBrowserSmall() {
  browser.manage().window().setSize(640, 480);
}

function setBrowserWidthSmall() {
  browser.manage().window().setSize(640, 768);
}

/**
 * Form helpers
 */
function getForm(formName) {
  return element(by.css('form[name="' + formName + '"]'));
}

function getFormFields(formName) {
  return getForm(formName).all(by.css('input, textarea, select'));
}

function getFormField(formName, fieldName) {
  return getForm(formName).element(by.css('[name="' + fieldName + '"]'));
}

function getAttribute(field, attr) {
  return field.getAttribute(attr);
}

function getFieldType(field) {
  return getAttribute(field, 'type');
}

/**
 * Table helpers
 */
function getTableRows(table) {
  return table.all(by.css('tbody tr'));
}

function getTableRowAt(table, rowIndex) {
  return table.all(by.css('tbody tr')).get(rowIndex);
}

function getTableCellAt(table, rowIndex, colIndex) {
  return getTableRows(table).get(rowIndex).all(by.css('td')).get(colIndex);
}

/**
 * Flyout helpers
 */
function closeFlyout() {
  element(by.css('flyout'))
    .element(by.css('.flyout-header button.close')).click();
  browser.driver.sleep(2000);
}
