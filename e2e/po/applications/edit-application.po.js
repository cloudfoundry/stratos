(function () {
  'use strict';

  var inputText = require('../widgets/input-text.po');
  var asyncDialog = require('../widgets/async-dialog.po');

  module.exports = {
    name: name,
    memoryUsage: memoryUsage,
    instances: instances,
    cancel: cancel,
    save: save,
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

  function save() {
    return asyncDialog.commit();
  }

  function getTitle() {
    return asyncDialog.getTitle();
  }

  function name() {
    return inputText.wrap(asyncDialog.getContentElement().all(by.css('.form-group')).get(0));
  }

  function memoryUsage() {
    return inputText.wrap(asyncDialog.getContentElement().all(by.css('.form-group')).get(1));
  }

  function instances() {
    return inputText.wrap(asyncDialog.getContentElement().all(by.css('.form-group')).get(2));
  }

})();
