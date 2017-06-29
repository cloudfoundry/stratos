(function () {
  'use strict';

  var inputText = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var inputSearchBox = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-search-box.po');
  var asyncDialog = require('../../../../../../app-core/frontend/test/e2e/po/widgets/async-dialog.po');

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
