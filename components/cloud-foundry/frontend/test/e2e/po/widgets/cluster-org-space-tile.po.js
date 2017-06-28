(function () {
  'use strict';

  var actionsMenuHelper = require('../../../../../../app-core/frontend/test/e2e/po/widgets/actions-menu.po');

  // We should split this out into separate po's when we need specific org/space functionality

  module.exports = {
    getOrgTile: getOrgTile,
    getSpaceTile: getSpaceTile,
    clickActionMenu: clickActionMenu
  };

  function getOrgTile(orgName) {
    return element.all(by.repeater('organization in clusterDetailController.organizations')).filter(function (tile) {
      return tile.element(by.css('.panel-heading > span.gallery-card-title')).getText().then(function (title) {
        return title === orgName;
      });
    }).first();
  }

  function getSpaceTile(spaceName) {
    return element.all(by.repeater('(spaceGuid, space) in clusterDetailSpacesController.spaces()')).filter(function (tile) {
      return tile.element(by.css('.panel-heading > span.gallery-card-title')).getText().then(function (title) {
        return title === spaceName;
      });
    }).first();
  }

  function clickActionMenu(tileElement, index) {
    var actionMenu = tileElement.element(by.css('.actions-menu'));
    actionsMenuHelper.click(actionMenu);
    actionsMenuHelper.clickItem(actionMenu, index);
  }

})();

