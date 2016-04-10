'use strict';

var sh = require('../../tools/node_modules/shelljs');
var request = require('../../tools/node_modules/request');

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
  getTableCellAt: getTableCellAt,

  createSession: createSession,
  getRequest: getRequest,
  resetDatabase: resetDatabase

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

function getRequest() {
  var cookieJar = request.jar();
  var req = request.defaults({
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    jar: cookieJar
  });

  return req;
}

/**
 * Clean up database
 */
function createSession(req) {
  return new Promise(function (resolve, reject) {
    var loginUrl = 'http://' + hostIp + ':3000/api/auth/login';

    req.post({
      headers: {'content-type': 'application/json'},
      url: loginUrl,
      body: JSON.stringify({username: 'dev', password: 'dev'})
    }, function (error, response) {
      if (!error && response.statusCode === 200) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}

function unregisterUser(req, jar) {
  var removeUrl = 'http://' + hostIp + '/api/users/1';
  req.put({
    cookie: jar.getCookieString(hostIp),
    headers: {'content-type': 'application/json'},
    url: removeUrl,
    body: JSON.stringify({registered: false})
  });
}

function resetDatabase() {
  var cookieJar = request.jar();
  var req = request.defaults({
    jar: cookieJar
  });

  createSession(req).then(function () {
    unregisterUser(req, cookieJar);
  }, function (err) {
    console.log('Unable to reset the DB');
    console.log('Error:' + err);
  });
}
