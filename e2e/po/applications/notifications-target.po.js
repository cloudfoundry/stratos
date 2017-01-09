(function () {
  'use strict';

  var helpers = require('../helpers.po');

  module.exports = {
    doneButton: doneButton,
    cancel: cancel,

    getTargetTypes: getTargetTypes,

    addNewNotificationTarget: addNewNotificationTarget,

  };

  function doneButton() {
    return element(by.css('.btn-primary'));
  }

  function cancel() {
    return element(by.css('.btn-default'));
  }

  function getTargetTypes() {
    return element.all(by.repeater('notificationTargetType in wizardCtrl.options.notificationTargetTypes'));
  }

  function addNewNotificationTarget(targetType){
    return targetType.element(by.css('.btn.btn-sm.btn-link'));
  }

})();
