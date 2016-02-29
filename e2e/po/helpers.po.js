var sh = require('../../tools/node_modules/shelljs');

// Get host IP
var CMD = "/sbin/ip route|awk '/default/ { print $3 }'";
var hostIp = sh.exec(CMD, { silent: true }).output.trim();

module.exports = {

  getHost: getHost,
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
  getTableCellAt: getTableCellAt
};

function getHost() {
  return hostIp;
}

function newBrowser() {
  return browser.forkNewDriverInstance(true);
}

function loadApp() {
  browser.manage().deleteAllCookies();
  browser.get('http://' + hostIp);
}

function setBrowserNormal() {
  browser.driver.manage().window().setSize(1024, 768);
}

function setBrowserSmall() {
  browser.driver.manage().window().setSize(640, 480);
}

function setBrowserWidthSmall() {
  browser.driver.manage().window().setSize(640, 768);
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
