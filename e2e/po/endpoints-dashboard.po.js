'use strict';

var navbar = require('./navbar.po');
var helpers = require('../po/helpers.po');

module.exports = {
  showEndpoints: showEndpoints,
  goToEndpoints: goToEndpoints,
  isEndpoints: isEndpoints,
  clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
  clickAddClusterInTile: clickAddClusterInTile,
  welcomeMessage: welcomeMessage,
  registerCloudFoundryTile: registerCloudFoundryTile,
  registerCodeEngineTile: registerCodeEngineTile,
  getAddEndpoint: getAddEndpoint
};

function showEndpoints() {
  navbar.goToView('Endpoints');
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
  return element.all(by.css('#welcome-message span.tile-btn')).then(function(links) {
    if (serviceType === 'hcf') {
      return links[0].click();
    } else {
      return links[1].click();
    }
  });
}

function clickAddClusterInTile(serviceType) {
  return getNoInstanceTile(serviceType).element(by.linkText('Register An Endpoint')).click().then(function() {
    return browser.driver.sleep('1000');
  });
}

function registerCloudFoundryTile() {
  return getNoInstanceTile('hcf');
}

function registerCodeEngineTile() {
  return getNoInstanceTile('hce');
}

function getNoInstanceTile(serviceType) {
  return element(by.css('service-tile[service-type*="' + serviceType + '"]'));
}

function getAddEndpoint() {
  return element(by.css('form[name="form.regForm"]'));
}
