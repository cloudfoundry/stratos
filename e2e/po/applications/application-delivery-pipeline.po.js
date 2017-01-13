(function () {
  'use strict';

  var wizard = require('../widgets/wizard.po');
  var helpers = require('../helpers.po');
  var actionMenu = require('../widgets/actions-menu.po');
  var confirmationModal = require('../widgets/confirmation-modal.po');

  module.exports = {
    setupPipelineButton: setupPipelineButton,
    getDeliveryPipelineStatusMessage: getDeliveryPipelineStatusMessage,

    getSetupElement: getSetupElement,
    getSetupWizard: getSetupWizard,
    getDeliveryPipelineSummary: getDeliveryPipelineSummary,
    getTokenLink: getTokenLink,
    getRepositoryLink: getRepositoryLink,
    getSourceText: getSourceText,
    getBranchText: getBranchText,
    getBuildContainerText: getBuildContainerText,
    getHceEndpointUrlText: getHceEndpointUrlText,
    getAddTargetButton: getAddTargetButton,
    getAddPostDeployActionButton: getAddPostDeployActionButton,

    getNotificationTargetsSection: getNotificationTargetsSection,
    getNotificationTargets: getNotificationTargets,
    getNotificationTargetDeleteAction: getNotificationTargetDeleteAction,
    getNoNotificationTargetsMessage: getNoNotificationTargetsMessage,

    getPostDeployActionsSection: getPostDeployActionsSection,
    getPostDeployActions: getPostDeployActions,
    getPostDeployActionDeleteAction: getPostDeployActionDeleteAction,
    getNoPostDeployActionsMessage: getNoPostDeployActionsMessage,

    getVCSServer: getVCSServer,
    isVCSServerEnabled: isVCSServerEnabled,
    acknowledgeDeletion: acknowledgeDeletion,
    addNewTokenButton: addNewTokenButton,
    manageVcsTokenButton: manageVcsTokenButton,
    deletePipelineButton: deletePipelineButton
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
      .all(by.css('dl')).get(colIndex)
      .all(by.css('dd')).get(rowIndex);
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

  function getNotificationTargetsSection() {
    return element(by.id('notification-targets'));
  }

  function getPostDeployActionsSection() {
    return element(by.id('post-deploy-actions'));
  }

  function getAddTargetButton() {
    return getNotificationTargetsSection()
      .element(by.css('.btn.btn-link'));
  }

  function getAddPostDeployActionButton() {
    return getPostDeployActionsSection()
      .element(by.css('.btn.btn-link'));
  }

  function getNotificationTargets() {
    return getNotificationTargetsSection().all(by.repeater('target in applicationDeliveryPipelineCtrl.notificationTargets'));
  }

  function getNoNotificationTargetsMessage() {
    return getNotificationTargetsSection()
      .element(by.css('.panel-body > span'));
  }

  function getNotificationTargetDeleteAction(rowIndex) {
    return getNotificationTargets().get(rowIndex)
      .element(by.css('actions-menu'));
  }

  function acknowledgeDeletion() {
    return confirmationModal.commit();
  }

  function getPostDeployActions() {
    return getPostDeployActionsSection().all(by.repeater('postDeployAction in applicationDeliveryPipelineCtrl.postDeployActions'));
  }

  function getPostDeployForm() {
    return helpers.getForm('form.postDeployForm');
  }

  function getNoPostDeployActionsMessage() {
    return getPostDeployActionsSection()
      .element(by.css('.panel-body > span'));
  }

  function getPostDeployActionDeleteAction(rowIndex) {
    return getPostDeployActions().get(rowIndex)
      .element(by.css('actions-menu'));
  }

  function deletePipelineButton() {
    return element(by.css('.panel-heading > .btn.btn-link'));
  }
})();
