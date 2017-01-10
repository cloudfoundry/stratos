(function () {
  'use strict';

  var asyncDialog = require('../widgets/async-dialog-view.po');

  module.exports = {
    doneButton: doneButton,
    cancel: cancel,

    getTargetTypes: getTargetTypes,

    addNewNotificationTarget: addNewNotificationTarget,

    getDialog: getDialog

  };

  function getDialog() {
    return asyncDialog.wrap(getDialogElement());
  }

  function getDialogElement() {
    return element(by.css('.async-dialog'));
  }

  function doneButton() {
    return element(by.css('.btn-primary'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function getTargetTypes() {
    return element.all(by.repeater('notificationTargetType in wizardCtrl.options.notificationTargetTypes'));
  }

  function addNewNotificationTarget(targetType) {
    return targetType.element(by.css('.btn.btn-sm.btn-link'));
  }

})();
