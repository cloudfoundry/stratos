(function () {
  'use strict';

  //var endpointDashboard = require('./endpoints-dashboard.po');
  //var helpers = require('../helpers.po');

  module.exports = {
    goToOrg: goToOrg,
    goToSpace: goToSpace
  };

  function goToTileByName(tileElementName, tileName) {
    var matchingTile = element.all(by.css(tileElementName)).filter(function (elem) {
      return elem.element(by.css('.gallery-card-title')).getText().then(function (text) {
        return text === tileName;
      });
    }).first();
    return matchingTile.element(by.css('.panel-heading.linked')).click();
  }

  function goToOrg(orgName) {
    return goToTileByName('organization-tile', orgName);
  }

  function goToSpace(spaceName) {
    return goToTileByName('organization-space-tile', spaceName);
  }
})();

