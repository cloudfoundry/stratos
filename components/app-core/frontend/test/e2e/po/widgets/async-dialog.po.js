(function () {
  'use strict';

  module.exports = {
    cancel: cancel,
    getCancel: getCancel,
    commit: commit,
    getCommit: getCommit,
    getTitle: getTitle,
    isDisplayed: isDisplayed,
    getElement: getElement,
    getContentElement: getContentElement,
    getButtonsElement: getButtonsElement
  };

  function getElement() {
    return element(by.css('.modal-content .async-dialog'));
  }

  function getContentElement() {
    return getElement().element(by.css('.detail-view-content'));
  }

  function getButtonsElement() {
    return getElement().element(by.css('.form-actions.modal-footer'));
  }

  function isDisplayed() {
    return getElement().isDisplayed();
  }

  function getCancel() {
    return getButtonsElement().element(by.css('.btn-default'));
  }

  function cancel() {
    return getCancel().click();
  }

  function getCommit() {
    return getButtonsElement().element(by.css('.btn-commit'));
  }

  function commit() {
    return getCommit().click();
  }

  function getTitle() {
    return getContentElement().element(by.css('.detail-view-header')).getText();
  }
})();
