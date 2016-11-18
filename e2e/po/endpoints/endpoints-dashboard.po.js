(function () {
  'use strict';

  var navbar = require('../navbar.po');
  var helpers = require('../helpers.po');
  var credentialsFormHelper = require('../widgets/credentials-form.po');

  module.exports = {
    showEndpoints: showEndpoints,
    goToEndpoints: goToEndpoints,
    isEndpoints: isEndpoints,

    clickAddClusterInWelcomeMessage: clickAddClusterInWelcomeMessage,
    welcomeMessage: welcomeMessage,
    welcomeMessageAdmin: welcomeMessageAdmin,
    welcomeMessageNonAdmin: welcomeMessageNonAdmin,

    getEndpointTable: getEndpointTable,
    endpointConnectLink: endpointConnectLink,
    endpointDisconnectLink: endpointDisconnectLink,
    endpointStatus: endpointStatus,
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
    return element.all(by.css('#welcome-message span.tile-btn')).click();
  }

  function getEndpointTable() {
    return element(by.css('.endpoints-table table'));
  }

  function endpointConnectLink(row) {
    //TODO: RC THis will only work for non-admin. Admin users have an action menu instead of single 'connect/disconnect' link
    var anchor = helpers.getTableCellAt(getEndpointTable(), row, 4).element(by.css('a'));
    expect(anchor.element(by.css('span')).getText()).toEqual('CONNECT');
    return anchor;
  }

  function endpointDisconnectLink(row) {
    //TODO: RC THis will only work for non-admin. Admin users have an action menu instead of single 'connect/disconnect' link
    var anchor = helpers.getTableCellAt(getEndpointTable(), row, 4).element(by.css('a'));
    expect(anchor.element(by.css('span')).getText()).toEqual('DISCONNECT');
    return anchor;
  }

  function endpointStatus(rowIndex, statusClass) {
    return helpers.getTableCellAt(getEndpointTable(), rowIndex, 1).element(by.css('.' + statusClass));
  }

  function endpointError(rowIndex) {
    var row = helpers.getTableRowAt(getEndpointTable(), rowIndex+1);
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
