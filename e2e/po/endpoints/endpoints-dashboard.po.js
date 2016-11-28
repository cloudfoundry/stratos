(function () {
  'use strict';

  var navbar = require('../navbar.po');
  var helpers = require('../helpers.po');
  var actionMenu = require('../widgets/actions-menu.po');
  var credentialsFormHelper = require('../widgets/credentials-form.po');

  module.exports = {
    showEndpoints: showEndpoints,
    showHcfEndpoints: showHcfEndpoints,
    goToEndpoints: goToEndpoints,
    isEndpoints: isEndpoints,

    clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
    welcomeMessage: welcomeMessage,
    welcomeMessageAdmin: welcomeMessageAdmin,
    welcomeMessageNonAdmin: welcomeMessageNonAdmin,

    getEndpointTable: getEndpointTable,
    getRowWithEndpointName: getRowWithEndpointName,
    endpointNameClick: endpointNameClick,
    endpointName: endpointName,
    endpointIsDisconnected: endpointIsDisconnected,
    endpointIsConnected: endpointIsConnected,
    endpointType: endpointType,
    endpointUrl: endpointUrl,
    endpointConnectLink: endpointConnectButton,
    endpointDisconnectLink: endpointDisconnectButton,
    endpointActionMenu: endpointActionMenu,
    endpointError: endpointError,

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
  function showHcfEndpoints() {
    return navbar.goToView('endpoint.clusters');
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
    return element(by.css('#welcome-message'));
  }

  function welcomeMessageAdmin() {
    var panels = welcomeMessage().all(by.css('.panel-body'));
    // First message should be visible
    return panels.get(0).isDisplayed();
  }

  function welcomeMessageNonAdmin() {
    var panels = welcomeMessage().all(by.css('.panel-body'));
    // Second message should be visible
    return panels.get(1).isDisplayed();
  }

  function clickAddClusterInWelcomeMessage() {
    return element.all(by.css('#welcome-message span.tile-btn')).first().click();
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

  function endpointName(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 0).getText();
  }

  function endpointNameClick(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 0).element(by.css('a')).click();
  }

  function endpointIsDisconnected(row) {
    return endpointGetStatus(row, 'helion-icon-Connect').isPresent();
  }

  function endpointIsConnected(row) {
    return endpointGetStatus(row, 'helion-icon-Active_L').isPresent();
  }

  function endpointGetStatus(rowIndex, statusClass) {
    return helpers.getTableCellAt(getEndpointTable(), rowIndex, 1).element(by.css('.' + statusClass));
  }

  function endpointType(row) {
    return helpers.getTableCellAt(getEndpointTable(), row, 2).getText();
  }

  function endpointIsErrorRow(row) {
    return helpers.getTableRowAt(getEndpointTable(), row).getAttribute('table-inline-message').then(function (text) {
      return !!text;
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

  function endpointUrl(rowIndex) {
    return helpers.getTableCellAt(getEndpointTable(), rowIndex, 1).getText();
  }

  function endpointError(rowIndex) {
    var row = helpers.getTableRowAt(getEndpointTable(), rowIndex + 1);
    expect(row.getAttribute('table-inline-message')).toBeDefined();
    return row;
  }

  function getHeaderRegister() {
    return element(by.css('.endpoints-dashboard .header button'));
  }

  function headerRegister() {
    return getHeaderRegister().click();
  }

  function headerRegisterVisible() {
    return getHeaderRegister().isPresent();
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
