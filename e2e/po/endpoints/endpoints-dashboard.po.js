(function () {
  'use strict';

  var navbar = require('../navbar.po');
  var helpers = require('../helpers.po');

  module.exports = {
    showEndpoints: showEndpoints,
    goToEndpoints: goToEndpoints,
    isEndpoints: isEndpoints,
    clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
    clickAddClusterInTile: clickAddClusterInTile,
    welcomeMessage: welcomeMessage,
    getCloudFoundryTile: getCloudFoundryTile,
    getCodeEngineTile: getCodeEngineTile,
    getAddEndpoint: getAddEndpoint,
    hasRegisteredTypes: hasRegisteredTypes,
    getTileStats: getTileStats
  };

  function showEndpoints() {
    return navbar.goToView('Endpoints');
  }

  function goToEndpoints() {
    return browser.get(helpers.getHost() + '/#/endpoint');
  }

  function isEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return expect(url).toBe(helpers.getHost() + '/#/endpoint');
    });
  }

  function welcomeMessage() {
    return element(by.id('welcome-message'));
  }

  function clickAddClusterInWelcomeMessage(serviceType) {
    var index = serviceType === 'hcf' ? 0 : 1;
    return element.all(by.css('#welcome-message span.tile-btn')).get(index).click();
  }

  function clickAddClusterInTile(serviceType) {
    return getInstanceTile(serviceType).element(by.linkText('Register An Endpoint')).click();
  }

  function getCloudFoundryTile() {
    return getInstanceTile('hcf');
  }

  function getCodeEngineTile() {
    return getInstanceTile('hce');
  }

  function getInstanceTile(serviceType) {
    return element(by.css('service-tile[service-type*="' + serviceType + '"]'));
  }

  function getAddEndpoint() {
    return element(by.css('form[name="form.regForm"]'));
  }

  function hasRegisteredTypes(serviceType) {
    return getInstanceTile(serviceType).element(by.css('ring-chart')).isPresent();
  }

  function getTileStats(serviceType) {
    return getInstanceTile(serviceType).all(by.css('ul.ring-chart-labels li')).then(function (listOfLi) {
      var promises = [];
      for (var i = 0; i < listOfLi.length; i++) {
        promises.push(listOfLi[i].element(by.css('.ring-chart-count')).getText().then(function (text) {
          return text;
        }));
      }
      return Promise.all(promises).then(function (result) {
        return result;
      });
    });
  }
})();
