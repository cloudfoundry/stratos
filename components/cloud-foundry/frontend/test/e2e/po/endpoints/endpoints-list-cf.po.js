(function () {
  'use strict';

  var helpers = require('../../../../../../app-core/frontend/test/e2e/po/helpers.po');
  var navbar = require('../../../../../../app-core/frontend/test/e2e/po/navbar.po');

  module.exports = {
    showCfEndpoints: showCfEndpoints,
    goToCfEndpoints: goToCfEndpoints,
    isCfEndpoints: isCfEndpoints,
    isCfOganizationsDetails: isCfOganizationsDetails,
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

  function showCfEndpoints() {
    return navbar.goToView('endpoint.clusters');
  }

  function goToCfEndpoints() {
    return browser.get(helpers.getHost() + '/#/endpoint/cf');
  }

  function isEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toBe(helpers.getHost() + '/#/endpoint');
    });
  }

  function isCfEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toBe(helpers.getHost() + '/#/endpoint/cf/list');
    });
  }

  function getBreadcrumb(index) {
    return element(by.repeater('step in steps').row(index));
  }

  function clickBreadcrumb(index) {
    return getBreadcrumb(index).click();
  }

  function isCfOganizationsDetails() {
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
    return getHeaderRegister().isDisplayed();
  }

  function getHeaderRegister() {
    return element(by.css('.endpoints.cluster-tiles .header button:first-of-type'));
  }

  function inlineRegister() {
    return element(by.css('.empty-view-message a:first-of-type')).click();
  }
})();
