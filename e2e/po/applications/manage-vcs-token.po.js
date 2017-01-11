(function () {
  'use strict';

  var helpers = require('../helpers.po');
  var confirmationModel = require('../widgets/confirmation-modal.po');
  var actionMenu = require('../widgets/actions-menu.po');

  module.exports = {
    doneButton: doneButton,
    cancel: cancel,
    addNewTokenButton: addNewTokenButton,
    getTokensCount: getTokensCount,
    clickActionsMenu: clickActionsMenu,

    getActionsMenu: getActionsMenu,
    getActionMenuItems: getActionMenuItems,
    getActionMenuItemText: getActionMenuItemText,

    clickActionMenuItem: clickActionMenuItem,
    isDeleteModalPresent: isDeleteModalPresent,
    isManageTokensDialog: isManageTokensDialog,

    confirmModal: confirmModal,
    cancelModal: cancelModal,

    getRowWithTokenName: getRowWithTokenName,
    isTokenValid: isTokenValid,
    isTokenInvalid: isTokenInvalid
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

  function isManageTokensDialog() {
    return element(by.css('.manage-tokens')).isDisplayed();
  }

  function getTokensCount() {
    var tokenRows = helpers.getTableRows(getTokensTable());
    var tokenCount = 0;
    return tokenRows.each(function (element, index) {
      return tokenIsMessageRow(index).then(function (isMessageRow) {
        if (isMessageRow) {
          return;
        }
        tokenCount += 1;
      });
    }).then(function () {
      // Subtract `Add New Token` row
      return tokenCount - 1;
    });
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

  function isTokenInvalid(row) {
    return helpers.getTableRowAt(getTokensTable(), row).element(by.css('.helion-icon-Critical_L')).isPresent();
  }

  function isTokenValid(row) {
    return helpers.getTableRowAt(getTokensTable(), row).element(by.css('.helion-icon-Active_L')).isPresent();
  }

  function getRowWithTokenName(name) {
    var tokenRows = helpers.getTableRows(getTokensTable());
    var rowIndex;
    return tokenRows.each(function (element, index) {
      return tokenIsMessageRow(index).then(function (isMessageRow) {
        if (isMessageRow) {
          return;
        }
        return tokenName(index).then(function (tokenName) {
          if (tokenName.toLowerCase() === name.toLowerCase()) {
            rowIndex = index;
          }
        });
      });
    }).then(function () {
      return rowIndex;
    });
  }

  function tokenName(row) {
    return helpers.getTableCellAt(getTokensTable(), row, 0).getText();
  }

  function tokenIsMessageRow(row) {
    return helpers.getTableRowAt(getTokensTable(), row).getAttribute('table-inline-message').then(function (text) {
      return text === '';
    });
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
