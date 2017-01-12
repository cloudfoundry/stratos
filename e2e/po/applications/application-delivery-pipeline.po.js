(function () {
  'use strict';

  var wizard = require('../widgets/wizard.po');

  module.exports = {
    setupPipelineButton: setupPipelineButton,
    getDeliveryPipelineStatusMessage: getDeliveryPipelineStatusMessage,

    getSetupElement: getSetupElement,
    getSetupWizard: getSetupWizard,
    getTokenLink: getTokenLink,
    getRepositoryLink: getRepositoryLink,
    getSourceText: getSourceText,
    getBranchText: getBranchText,
    getBuildContainerText: getBuildContainerText,
    getHceEndpointUrlText: getHceEndpointUrlText,
    getAddTargetButton: getAddTargetButton,
    getAddPostDeployActionButton: getAddPostDeployActionButton,

    getNotificationTargets: getNotificationTargets,
    getNoNotificationTargetsMessage: getNoNotificationTargetsMessage,

    getPostDeployActions: getPostDeployActions,
    getNoPostDeployActionsMessage: getNoPostDeployActionsMessage,

    getVCSServer: getVCSServer,
    isVCSServerEnabled: isVCSServerEnabled,
    addNewTokenButton: addNewTokenButton,
    manageVcsTokenButton: manageVcsTokenButton
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

  function manageVcsTokenButton() {
    return element(by.css('.manage-tokens-link'));
  }

  function getDeliveryPipelineSummary() {
    return element(by.css('.delivery-pipeline-summary'));
  }


  function getSummaryRow(colIndex, rowIndex) {
    return getDeliveryPipelineSummary()
      .element.all(by.css('dl')).get(colIndex)
      .element.all(by.css('dd')).get(rowIndex);
  }

  function getTokenLink() {
    return getSummaryRow(0, 1).element(by.css('a'));
  }

  function getRepositoryLink() {
    return getSummaryRow(0, 2).element(by.css('a'));
  }

  function getSourceText() {
    return getSummaryRow(0, 0).getText();
  }

  function getBranchText() {
    return getSummaryRow(1, 0).getText();
  }

  function getBuildContainerText() {
    return getSummaryRow(1, 1).getText();
  }

  function getHceEndpointUrlText() {
    return getSummaryRow(1, 2).getText();
  }

  function getNotificationTargetsSection(){
    return element(by.id('notification-targets'));
  }
  function getAddTargetButton() {
    return getNotificationTargetsSection()
      .element(by.css('.btn.btn-link'));
  }

  function getAddPostDeployActionButton() {
    return element(by.id('post-deploy-actions'))
      .element(by.css('.btn.btn-link'));
  }

  function getNotificationTargets() {
    return getNotificationTargetsSection().
    element.all(by.repeater('target in applicationDeliveryPipelineCtrl.notificationTargets'));
  }

  function getNoNotificationTargetsMessage(){
    return getNotificationTargetsSection().

  }


})();
