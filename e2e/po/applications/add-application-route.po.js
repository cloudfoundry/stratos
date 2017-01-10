(function () {
  'use strict';

  var inputText = require('../widgets/input-text.po');
  var inputSearchBox = require('../widgets/input-search-box.po');

  module.exports = {
    host: host,
    domain: domain,
    cancel: cancel,
    commit: commit,
    getTitle: getTitle,
    isDisplayed: isDisplayed,
    getElement: getElement
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

  function domain() {
    return inputSearchBox.wrap(getContentElement().all(by.css('.form-group')).get(1));
  }

  function host() {
    return inputText.wrap(getContentElement().all(by.css('.form-group')).get(0));
  }
})();
