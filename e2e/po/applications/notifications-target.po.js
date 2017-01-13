(function () {
  'use strict';

  var asyncDialog = require('../widgets/async-dialog-view.po');
  var wizard = require('../widgets/wizard.po');

  module.exports = {
    doneButton: doneButton,
    cancel: cancel,

    getTargetTypes: getTargetTypes,
    getDialog: getDialog,

    getWizardElement: getWizardElement,
    getWizard: getWizard,

    selectTargetType: selectTargetType,

    addNewNotificationTarget: addNewNotificationTarget
  };

  function getDialog() {
    return asyncDialog.wrap(getDialogElement());
  }

  function getDialogElement() {
    return element(by.css('.async-dialog'));
  }

  function getWizardElement(){
    return element(by.css('.add-notification-target'));
  }

  function getWizard(){
    return wizard.wrap(getWizardElement());
  }

  function doneButton() {
    return element(by.css('.modal-footer button.btn.btn-primary'));
  }

  function cancel() {
    return element(by.css('.modal-footer button.btn.btn-default'));
  }

  function getTargetTypes() {
    return element.all(by.repeater('notificationTargetType in wizardCtrl.options.notificationTargetTypes'));
  }

  function selectTargetType(index){
    return getTargetTypes().get(index).element(by.css('radio-input')).click();
  }
  function addNewNotificationTarget(targetType) {
    return targetType.element(by.css('.btn.btn-sm.btn-link'));
  }

})();
