(function () {
  'use strict';

  var inputText = require('../widgets/input-text.po');
  var inputSearchBox = require('../widgets/input-search-box.po');
  var asyncDialog = require('../widgets/async-dialog.po');

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
    return asyncDialog.getElement();
  }

  function isDisplayed() {
    return getElement().isDisplayed();
  }

  function cancel() {
    return asyncDialog.cancel();
  }

  function commit() {
    return asyncDialog.commit();
  }

  function getTitle() {
    return asyncDialog.getTitle();
  }

  function domain() {
    return inputSearchBox.wrap(asyncDialog.getContentElement().all(by.css('.form-group')).get(1));
  }

  function host() {
    return inputText.wrap(asyncDialog.getContentElement().all(by.css('.form-group')).get(0));
  }
})();
