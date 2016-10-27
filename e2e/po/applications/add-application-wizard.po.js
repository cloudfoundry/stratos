'use strict';

// var navbar = require('./navbar.po');
var inputText = require('../widgets/input-text.po');
var inputSearchBox = require('../widgets/input-search-box.po');

module.exports = {
  isDisplayed: isDisplayed,
  name: name,
  hcf: hcf,
  organization: organization,
  space: space,
  domain: domain,
  host: host,
  isNextEnabled: isNextEnabled,
  next: next,
  isCancelEnabled: isCancelEnabled,
  cancel: cancel
};

function isDisplayed() {
  return getElement().isDisplayed();
}

function getElement() {
  return element(by.css('add-app-workflow'));
}

function name() {
  return inputText.wrap(getElement().all(by.css('.form-group')).get(0));
}

function hcf() {
  return inputSearchBox.wrap(getElement().all(by.css('.form-group')).get(1));
}

function organization() {
  return inputSearchBox.wrap(getElement().all(by.css('.form-group')).get(2));
}

function space() {
  return inputSearchBox.wrap(getElement().all(by.css('.form-group')).get(3));
}

function domain() {
  return inputSearchBox.wrap(getElement().all(by.css('.form-group')).get(4));
}

function host() {
  return inputText.wrap(getElement().all(by.css('.form-group')).get(5));
}

function isNextEnabled() {
  return _buttonEnabled(getElement().element(by.css('.wizard-foot .next')));
}

function next() {
  fail('TODO');
}

function isCancelEnabled() {
  return _buttonEnabled(getElement().element(by.css('.wizard-foot .cancel')));
}

function cancel() {
  fail('TODO');
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

