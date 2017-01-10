(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var confirmationModel = require('../widgets/confirmation-modal.po');
  var actionMenu = require('../widgets/actions-menu.po');

  module.exports = {
    doneButton: doneButton,
    cancel: cancel,
    addNewTokenButton: addNewTokenButton,
    getTokensList: getTokensList,
    clickActionsMenu: clickActionsMenu,

    getActionsMenu: getActionsMenu,
    getActionMenuItems: getActionMenuItems,
    getActionMenuItemText: getActionMenuItemText,

    clickActionMenuItem: clickActionMenuItem,
    isDeleteModalPresent: isDeleteModalPresent,
    confirmModal: confirmModal,
    cancelModal: cancelModal,

    getStatusCell: getStatusCell
  };

  function doneButton() {
    return element(by.css('.modal-footer button.btn.btn-primary'));
  }

  function cancel() {
    return element(by.css('.detail-view-close .close'));
  }

  function addNewTokenButton() {
    return element(by.css('.add-new-token'));
  }

  function getTokensList() {
    return element.all(by.repeater('vcsToken in asyncTaskDialogCtrl.context.stTableTokens'));
  }

  function getTokensTable() {
    return element(by.css('table.tokens-list-table'));
  }

  function getActionsMenu(row) {
    return helpers.getTableCellAt(getTokensTable(), row, 3).element(by.css('actions-menu'));
  }

  function clickActionsMenu(row) {
    return helpers.getTableCellAt(getTokensTable(), row, 3).element(by.css('actions-menu .dropdown-toggle'));
  }

  function getStatusCell(row) {
    return helpers.getTableCellAt(getTokensTable(), row, 1);
  }

  function getActionMenuItems(row) {
    return actionMenu.getItems(getActionsMenu(row));
  }

  function getActionMenuItemText(row, index) {
    return actionMenu.getItemText(getActionsMenu(row), index);
  }

  function clickActionMenuItem(row, index) {
    return actionMenu.clickItem(getActionsMenu(row), index);
  }

  function isDeleteModalPresent() {
    return confirmationModel.isVisible();
  }

  function confirmModal() {
    return confirmationModel.commit();
  }

  function cancelModal() {
    return confirmationModel.cancel();
  }

})();
