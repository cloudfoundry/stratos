'use strict';

var _ = require('../../../tools/node_modules/lodash');

module.exports = {
  getTitle: getTitle,

  getSteps: getSteps,
  getStepNames: getStepNames,
  getCurrentStep: getCurrentStep,

  getCancel: getCancel,
  getBack: getBack,
  getNext: getNext,

  isCancelEnabled: isCancelEnabled,
  isNextEnabled: isNextEnabled,
  
  cancel: cancel,
  next: next
};

function getTitle() {
  return element(by.css('.wizard-head h4')).getText();
}

function getSteps() {
  return element.all(by.css('.wizard-nav-item'));
}

function getStepNames() {
  return getSteps().then(function (steps) {
    var promises = [];
    _.forEach(steps, function (step) {
      promises.push(step.getText());
    });
    return Promise.all(promises);
  });
}

function getCurrentStep() {
  return element(by.css('wizard-nav-item nav-item active'));
}

function getCancel() {
  return element(by.css('.wizard-foot .btn.cancel'));
}

function getBack() {
  return element(by.css('.wizard-foot .btn.back'));
}

function getNext() {
  return element(by.css('.wizard-foot .btn.next'));
}

function isCancelEnabled() {
  return _buttonEnabled(getCancel());
}

function isNextEnabled() {
  return _buttonEnabled(getNext());
}


function cancel() {
  return getCancel().click();
}

function next() {
  return getNext().click();
}

function _buttonEnabled(element) {
  return element.getAttribute('disabled')
    .then(function (isDisabled) {
      if (isDisabled === 'true') {
        return false;
      }
      if (isDisabled === 'false') {
        return true;
      }
      return isDisabled !== 'disabled';
    })
    .catch(function () {
      // no disabled attribute --> enabled button
      return true;
    });
}
