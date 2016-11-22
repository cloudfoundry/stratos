(function () {
  'use strict';

  var endpointDashboard = require('./endpoints-dashboard.po');
  var helpers = require('../helpers.po');

  module.exports = {
    showHcfEndpoints: showHcfEndpoints,
    goToHcfEndpoints: goToHcfEndpoints,
    isHcfEndpoints: isHcfEndpoints,
    isHcfOganizationsDetails: isHcfOganizationsDetails,
    getTiles: getTiles,
    isTileConnected: isTileConnected,
    getTileTitle: getTileTitle,
    getTileActionMenu: getTileActionMenu,
    headerRegister: headerRegister,
    headerRegisterVisible: headerRegisterVisible,
    inlineRegister: inlineRegister,
    getBreadcrumb: getBreadcrumb,
    clickBreadcrumb: clickBreadcrumb,
    isEndpoints: isEndpoints
  };

  function showHcfEndpoints() {
    return endpointDashboard.showHcfEndpoints();
  }

  function goToHcfEndpoints() {
    return browser.get(helpers.getHost() + '/#/endpoint/cluster');
  }

  function isEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toBe(helpers.getHost() + '/#/endpoint');
    });
  }

  function isHcfEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toBe(helpers.getHost() + '/#/endpoint/cluster/list');
    });
  }

  function getBreadcrumb(index) {
    return element(by.repeater('step in steps').row(index));
  }

  function clickBreadcrumb(index) {
    return getBreadcrumb(index).click();
  }

  function isHcfOganizationsDetails() {
    browser.debugger();
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toMatch(helpers.getHost() + '/#/endpoint/.*/organizations');
    });
  }

  function getTiles() {
    return element.all(by.repeater('(guid, service) in clustersCtrl.serviceInstances'));
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

  function headerRegister() {
    return getHeaderRegister().click();
  }

  function headerRegisterVisible() {
    return getHeaderRegister().isPresent();
  }

  function getHeaderRegister() {
    return element(by.css('.endpoints.cluster-tiles .header button:first-of-type'));
  }

  function inlineRegister() {
    return element(by.css('.empty-view-message a:first-of-type')).click();
  }
})();
