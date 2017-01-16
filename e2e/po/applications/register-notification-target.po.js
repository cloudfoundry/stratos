(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {

    isAddNotificationEnabled: isAddNotificationEnabled,

    addNotificationTargetButton: addNotificationTargetButton,
    enterNotificationTargetDetails: enterNotificationTargetDetails,
    cancel: cancel
  };

  function addNotificationTargetButton() {
    return element(by.css('.btn-commit'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function isAddNotificationEnabled() {
    return helpers.isButtonEnabled(addNotificationTargetButton());
  }

  function enterNotificationTargetDetails(targetName, serverUrl, token) {

    var targetNameField = element(by.model('wizardCtrl.options.userInput.notificationTargetDetails.name'));
    targetNameField.sendKeys(targetName);

    var serverUrlField = element(by.model('wizardCtrl.options.userInput.notificationTargetDetails.location'));
    serverUrlField.sendKeys(serverUrl);

    var tokenField = element(by.model('wizardCtrl.options.userInput.notificationTargetDetails.token'));
    return tokenField.sendKeys(token);
  }

})();
