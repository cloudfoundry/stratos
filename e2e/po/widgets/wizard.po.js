'use strict';

module.exports = {
  getTitle: getTitle,

  getSteps: getSteps,
  getStepNames: getStepNames,
  getCurrentStep: getCurrentSteps,

  getCancel: getCancel,
  getBack: getBack,
  getContinue: getNext
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

function getCurrentSteps() {
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

