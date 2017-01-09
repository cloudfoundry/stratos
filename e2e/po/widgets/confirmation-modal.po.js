(function () {
  'use strict';

  module.exports = {
    isVisible: isVisible,
    cancel: cancel,
    primary: primary,
    commit: commit,
    getTitle: getTitle,
    getBody: getBody,
    getElement: getElement
  };

  function getElement() {
    return element(by.css('.modal.confirm-dialog'));
  }

  function isVisible() {
    return element(by.css('.modal.confirm-dialog')).isPresent();
  }

  function cancel() {
    return element(by.css('.modal-footer button.btn.btn-default')).click();
  }

  function primary() {
    return element(by.css('.modal-footer button.btn.btn-primary')).click();
  }

  function commit() {
    return element(by.css('.modal-footer button.btn.btn-commit')).click();
  }

  function getTitle() {
    return element(by.css('.modal.confirm-dialog .modal-header h3')).getText();
  }

  function getBody() {
    return element(by.css('.modal.confirm-dialog .modal-body')).getText();
  }

})();
