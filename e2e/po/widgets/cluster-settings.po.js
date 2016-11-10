'use strict';

module.exports = {
  getClusterSettings: getClusterSettings,
  getItems: getItems,
  getItem: getItem,
  isExpired: isExpired,
  canReconnect: canReconnect,
  reconnect: reconnect
};

function getClusterSettings() {
  return element.all(by.css('.cluster-settings'));
}

function getItems(clusterSettings) {
  return clusterSettings.all(by.repeater('(name, cnsi) in clusterSettingsCtrl.serviceInstances'));
}

function getItem(clusterSettings, row) {
  return clusterSettings.all(by.repeater('(name, cnsi) in clusterSettingsCtrl.serviceInstances')).get(row);
}

function isExpired(item) {
  return item.element(by.css('.cluster-expired')).isPresent();
}

function canReconnect(item) {
  return item.element(by.linkText('Reconnect')).isDisplayed();
}

function reconnect(item) {
  return item.element(by.linkText('Reconnect')).click();
}

