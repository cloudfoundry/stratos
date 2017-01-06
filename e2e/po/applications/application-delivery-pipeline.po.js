(function () {
  'use strict';

  var wizard = require('../widgets/wizard.po');

  module.exports = {
    setupPipelineButton: setupPipelineButton,
    getDeliveryPipelineStatusMessage: getDeliveryPipelineStatusMessage,
    getSetupElement: getSetupElement,
    getSetupWizard: getSetupWizard,
    getVCSServer: getVCSServer,
    isVCSServerEnabled: isVCSServerEnabled,
    addNewTokenButton: addNewTokenButton
  };

  function setupPipelineButton() {
    return element(by.id('pipeline-setup-button'));
  }

  function getSetupWizard() {
    return wizard.wrap(getSetupElement());
  }

  function getSetupElement() {
    return element(by.css('add-pipeline-workflow'));
  }

  function getDeliveryPipelineStatus() {
    return element(by.tagName('delivery-pipeline-status'));
  }

  function getDeliveryPipelineStatusMessage() {
    return getDeliveryPipelineStatus().element(by.tagName('h3')).getText();
  }

  function getVCSServer() {
    return element(by.css('.media.vcs-token-selector'));
  }

  function isVCSServerEnabled() {
    return getVCSServer().isEnabled();
  }

  function addNewTokenButton() {
    return element(by.css('.add-new-token-wrapper'));
  }
})();
