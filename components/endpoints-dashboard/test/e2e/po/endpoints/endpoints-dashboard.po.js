(function () {
  'use strict';

  var _ = require('lodash');
  var navbar = require('../../../../../app-core/frontend/test/e2e/po/navbar.po');
  var helpers = require('../../../../../app-core/frontend/test/e2e/po/helpers.po');
  var actionMenu = require('../../../../../app-core/frontend/test/e2e/po/widgets/actions-menu.po');
  var credentialsFormHelper = require('../widgets/credentials-form.po');

  module.exports = {
    showEndpoints: showEndpoints,
    goToEndpoints: goToEndpoints,
    isEndpoints: isEndpoints,

    clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
    welcomeMessage: welcomeMessage,
    isWelcomeMessageAdmin: isWelcomeMessageAdmin,
    isWelcomeMessageNonAdmin: isWelcomeMessageNonAdmin,

    getEndpointTable: getEndpointTable,
    getRowWithEndpointName: getRowWithEndpointName,
    getRowWithEndpointType: getRowWithEndpointType,
    endpointNameClick: endpointNameClick,
    endpointName: endpointName,
    endpointIsDisconnected: endpointIsDisconnected,
    endpointIsConnected: endpointIsConnected,
    endpointIsCritical: endpointIsCritical,
    endpointType: endpointType,
    endpointUrl: endpointUrl,
    endpointConnectLink: endpointConnectButton,
    endpointActionButton: endpointActionButton,
    endpointDisconnectLink: endpointDisconnectButton,
    endpointActionMenu: endpointActionMenu,
    endpointError: endpointError,

    waitForEndpointTable: waitForEndpointTable,

    headerRegister: headerRegister,
    headerRegisterVisible: headerRegisterVisible,

    credentialsForm: credentialsForm,
    credentialsFormFields: credentialsFormFields,
    credentialsFormConnectButton: connectButton,
    credentialsFormCancel: credentialsFormCancel,
    credentialsFormFill: fillCredentialsForm,
    credentialsFormEndpointConnect: connectServiceInstance

  };

  function showEndpoints() {
    return navbar.goToView('Endpoints');
  }

  function goToEndpoints() {
    return browser.get(helpers.getHost() + '/#/endpoint');
  }

  function isEndpoints() {
    return browser.getCurrentUrl().then(function (url) {
      return url === helpers.getHost() + '/#/endpoint';
    });
  }

  function welcomeMessage() {
    return element(by.css('.endpoint-notification'));
  }

  function isWelcomeMessageAdmin() {
    var text = welcomeMessage().element(by.css('div:first-of-type'));
    return text.getText().then(function (text) {
      return text.trim().indexOf('To enable developers to use') === 0;
    });
  }

  function isWelcomeMessageNonAdmin() {
    var text = welcomeMessage().element(by.css('div:nth-of-type(2)'));
    return text.getText().then(function (text) {
      return text.trim().indexOf('To access your cloud native workloads') === 0;
    });
  }

  function clickAddClusterInWelcomeMessage() {
    return welcomeMessage().all(by.css('.btn-link.tile-btn')).first().click();
  }

  function getEndpointTable() {
    return element(by.css('.endpoints-table table'));
  }

  function getRowWithEndpointName(name) {
    var endpointsRows = helpers.getTableRows(getEndpointTable());
    var rowIndex;
    return endpointsRows.each(function (element, index) {
      return endpointIsErrorRow(index).then(function (isError) {
        if (isError) {
          return;
        }
        return endpointName(index).then(function (endpointName) {
          if (endpointName.toLowerCase() === name.toLowerCase()) {
            rowIndex = index;
          }
        });
      });
    }).then(function () {
      return rowIndex;
    });
  }

  function getRowWithEndpointType(typeName) {
    var endpointsRows = helpers.getTableRows(getEndpointTable());
    var rowIndex;
    return endpointsRows.each(function (element, index) {
      return endpointIsMessageRow(index).then(function (endpointRow) {
        if (!endpointRow) {
          return;
        }
        return endpointType(index).then(function (endpointType) {
          if (endpointType.toLowerCase() === typeName.toLowerCase()) {
            rowIndex = index;
          }
        });
      });
    }).then(function () {
      return rowIndex;
    });
  }

  function endpointName(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 0).getText();
  }

  function endpointNameClick(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 0).element(by.css('a')).click();
  }

  function endpointIsDisconnected(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 1).element(by.css("svg[src='/svg/NoConnection_Black.svg']")).isPresent();
  }

  function endpointIsConnected(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 1).element(by.css('.endpoint-connected-icon')).isPresent();
  }

  function endpointIsCritical(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 1).element(by.css('.endpoint-critical-icon')).isPresent();
  }

  function endpointType(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 2).getText();
  }

  function endpointIsErrorRow(row) {
    return helpers.getTableRowAt(getEndpointTable(), row).getAttribute('table-inline-message').then(function (text) {
      return !!text;
    });
  }
  function endpointIsMessageRow(row) {
    return helpers.getTableRowAt(getEndpointTable(), row).getAttribute('table-inline-message').then(function (text) {
      return _.isNull(text);
    });
  }

  function endpointConnectButton(row) {
    var actionMenuElement = endpointActionMenu(row);
    return actionMenu.isSingleButton(actionMenuElement).then(function (isSingleButton) {
      if (isSingleButton) {
        // Non-admin will only have connect or disconnected (ok maybe also reconnect)
        var anchor = actionMenu.getSingleButton(actionMenuElement);
        expect(anchor.element(by.css('span')).getText()).toEqual('CONNECT');
        return actionMenu.getSingleButton(actionMenuElement);
      } else {
        // Admin will have an action menu. Need to implement iterating over action menu item tests for 'connect'
        fail('Not implemented');
      }
    });
  }

  function endpointActionButton(row) {
    var actionMenuElement = endpointActionMenu(row);
    return actionMenu.isSingleButton(actionMenuElement).then(function (isSingleButton) {
      if (isSingleButton) {
        // Non-admin will only have connect or disconnected (ok maybe also reconnect)
        return actionMenu.getSingleButton(actionMenuElement);
      } else {
        fail('Not implemented');
      }
    });
  }

  function endpointDisconnectButton(row) {
    var actionMenuElement = endpointActionMenu(row);
    return actionMenu.isSingleButton(actionMenuElement).then(function (isSingleButton) {
      if (isSingleButton) {
        // Non-admin will only have connect or disconnected (ok maybe also reconnect)
        var anchor = actionMenu.getSingleButton(actionMenuElement);
        expect(anchor.element(by.css('span')).getText()).toEqual('DISCONNECT');
        return actionMenu.getSingleButton(actionMenuElement);
      } else {
        // Admin will have an action menu. Need to implement iterating over action menu item tests for 'connect'
        fail('Not implemented');
      }
    });
  }

  function endpointActionMenu(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 4).element(by.css('actions-menu'));
  }

  function endpointUrl(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 3).getText();
  }

  function endpointError(rowIndex) {
    var row = helpers.getTableRowAt(getEndpointTable(), rowIndex + 1);
    expect(row.getAttribute('table-inline-message')).toBeDefined();
    return row;
  }

  function waitForEndpointTable() {
    var until = protractor.ExpectedConditions;
    browser.wait(until.presenceOf(getEndpointTable()), 5000);
  }

  function getHeaderRegister() {
    return element(by.id('endpoints-dashboard.register-button'));
  }

  function headerRegister() {
    return getHeaderRegister().click();
  }

  function headerRegisterVisible() {
    return getHeaderRegister().isDisplayed();
  }

  function credentialsForm() {
    return credentialsFormHelper.credentialsForm(element(by.css('.detail-view-content')).element(by.css('.credentials-form')));
  }

  function credentialsFormFields() {
    return credentialsFormHelper.credentialsFormFields();
  }

  function connectButton() {
    return credentialsFormHelper.credentialsFormConnectButton();
  }

  function credentialsFormCancel() {
    return credentialsFormHelper.credentialsFormCancel();
  }

  function fillCredentialsForm(username, password) {
    return credentialsFormHelper.credentialsFormFill(username, password);
  }

  function connectServiceInstance() {
    return credentialsFormHelper.connect();
  }

})();
