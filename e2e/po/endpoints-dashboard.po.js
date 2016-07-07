'use strict';

var navbar = require('./navbar.po');

module.exports = {
  showEndpoints: showEndpoints,
  clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
  clickAddClusterInTille: clickAddClusterInTille,
  welcomeMessage: welcomeMessage,
  registerCloudFoundryTile: registerCloudFoundryTile,
  registerCodeEngineTile: registerCodeEngineTile,
  getAddEndpointFlyout: getAddEndpointFlyout,
  getAddClusterForm: getAddClusterForm,
  getBaseTile: getBaseTile
};

function showEndpoints() {
  navbar.goToView('Endpoints');
}

function welcomeMessage() {
  return element(by.id('welcome-message'));
}

function clickAddClusterInWelcomeMessage(serviceType) {
  if (serviceType === 'hcf') {
    return driver.findElement(by.linkText('register Cloud Foundry clusters')).click();
  } else {
    return driver.findElement(by.linkText('Code Engine endpoints')).click();
  }
}

function clickAddClusterInTille(serviceType) {
  if (serviceType === 'hcf') {
    return driver.findElement(by.linkText('Register a Cluster')).click();
  } else {
    return driver.findElement(by.linkText('Register an Endpoint')).click();
  }
}

function registerCloudFoundryTile() {
  return getNoInstanceTile('hcf)');
}

function registerCodeEngineTile() {
  return getNoInstanceTile('hce)');
}

function getNoInstanceTile(serviceType) {
  return element(by.id(serviceType + '-no-instances-tile'));
}

function getAddEndpointFlyout() {
  return element(by.tagName('add-cluster-form'));
}

function getAddClusterForm() {
  return element(by.css('hce-registration'));
}

function getBaseTile(serviceType) {
  return element(by.tagName('base-tile'));
}
