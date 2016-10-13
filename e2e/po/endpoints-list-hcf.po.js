'use strict';

var navbar = require('./navbar.po');
var helpers = require('../po/helpers.po');

module.exports = {
  goToHcfEndpoints: goToHcfEndpoints,
  isHcfEndpoints: isHcfEndpoints,
  getTiles: getTiles,
  isTileConnected: isTileConnected,
  getTileTitle: getTileTitle,
  getTileActionMenu: getTileActionMenu
};

function goToHcfEndpoints() {
  return browser.get(helpers.getHost() + '/#/endpoint/cluster');
}

function isHcfEndpoints() {
  return browser.getCurrentUrl().then(function (url) {
    return expect(url).toBe(helpers.getHost() + '/#/endpoint/cluster');
  });
}

function getTiles() {
  return element.all(by.repeater('(guid, service) in clustersCtrl.serviceInstances'));
  // return element(by.css('.endpoints.endpoints-view')).element(by.css('table'));
}

function isTileConnected(index) {
  return getTiles().get(index).element(by.css('.panel-body dl.dl-horizontal')).isPresent();
}

function getTileTitle(index) {
  return getTiles().get(index).element(by.css('.panel-heading span:first-of-type')).getText();
}

function getTileActionMenu(index) {
  return getTiles().get(index).element(by.css('actions-menu'));
}

