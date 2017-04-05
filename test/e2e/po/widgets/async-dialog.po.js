(function () {
  'use strict';

  module.exports = {
    cancel: cancel,
    commit: commit,
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

  function cancel() {
    return getButtonsElement().element(by.css('.btn-default')).click();
  }

  function commit() {
    return getButtonsElement().element(by.css('.btn-commit')).click();
  }

  function getTitle() {
    return getContentElement().element(by.css('.detail-view-header')).getText();
  }
})();
