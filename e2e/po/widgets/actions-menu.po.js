(function () {
  'use strict';

  module.exports = {
    getItems: getItems,
    getItemText: getItemText,
    clickItem: clickItem,
    click: click
  };

  function getItems(actionMenu) {
    return actionMenu.all(by.repeater('action in actionsMenuCtrl.actions'));
  }

  function getItemText(actionMenu, row) {
    // getText doesn't seem to work??
    return _getRow(actionMenu, row).getAttribute('innerText')
      .then(function (text) {
        return text.trim();
      });
  }

  function click(actionMenu) {
    return actionMenu.element(by.css('.actions-menu-icon')).click();
  }

  function clickItem(actionMenu, row) {
    return _getRow(actionMenu, row).click();
  }

  function _getRow(actionMenu, row) {
    return actionMenu.element(by.repeater('action in actionsMenuCtrl.actions').row(row));
  }
})();

