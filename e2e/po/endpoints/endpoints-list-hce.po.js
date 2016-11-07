'use strict';

var helpers = require('../helpers.po');
var endpointDashboard = require('./endpoints-dashboard.po');

module.exports = {
  showHceEndpoints: showHceEndpoints,
  goToHceEndpoints: goToHceEndpoints,
  isHceEndpoints: isHceEndpoints,
  getTable: getTable,
  getActionMenu: getActionMenu,
  headerRegister: headerRegister,
  headerRegisterVisible: headerRegisterVisible,
  inlineRegister: inlineRegister
};

function showHceEndpoints() {
  return endpointDashboard.showEndpoints().then(function () {
    return endpointDashboard.getCodeEngineTile().click();
  });
}

function goToHceEndpoints() {
  return browser.get(helpers.getHost() + '/#/endpoint/hce');
}

function isHceEndpoints() {
  return browser.getCurrentUrl().then(function (url) {
    return expect(url).toBe(helpers.getHost() + '/#/endpoint/hce');
  });
}

function getTable() {
  return element(by.css('.endpoints.endpoints-view')).element(by.css('table'));
}

function getActionMenu(row) {
  // There's one tr for the column headers + two per HCE (one for error bar)
  var rowIndex = row * 2 + 1;
  return getTable().all(by.css('tr')).get(rowIndex).element(by.css('actions-menu'));
}

function headerRegister() {
  return getHeaderRegister().click();
}

function headerRegisterVisible() {
  return getHeaderRegister().isDisplayed();
}

function getHeaderRegister() {
  return element(by.css('.endpoints.endpoints-view .header button:first-of-type'));
}

function inlineRegister() {
  return element(by.css('.empty-view-message a:first-of-type')).click();
}
