'use strict';

var navbar = require('./navbar.po');
var helpers = require('../po/helpers.po');

module.exports = {
  goToHceEndpoints: goToHceEndpoints,
  isHceEndpoints: isHceEndpoints,
  getTable: getTable,
  getActionMenu: getActionMenu
};

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

