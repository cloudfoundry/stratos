'use strict';

var sh = require('../../tools/node_modules/shelljs');
var request = require('../../tools/node_modules/request');

// Get host IP
var CMD = "/sbin/ip route|awk '/default/ { print $3 }'";
var hostIp = browser.params.hostIp || sh.exec(CMD, { silent: true }).output.trim();
var hostPort = browser.params.port || '';
var host = hostIp + (hostPort ? ':' + hostPort : '');
var hcfs = browser.params.cnsi.hcf || [{
  api_endpoint: 'https://api.hcf.hsc.stacktest.io',
  cnsi_name: 'hcf',
  skip_ssl_validation: 'true'
}];
var hces = browser.params.cnsi.hce || [{
  api_endpoint: 'https://api.hcf.hsc.stacktest.io',
  cnsi_name: 'hcf',
  skip_ssl_validation: 'true'
}];
var adminUser = browser.params.adminUser || 'admin@cnap.local';
var adminPassword = browser.params.adminPassword || 'cnapadmin';
var user = browser.params.credentials.user || 'user@cnap.local';
var password = browser.params.credentials.password || 'cnapuser';

module.exports = {

  getHost: getHost,
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
  browser.get('http://' + host);
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
