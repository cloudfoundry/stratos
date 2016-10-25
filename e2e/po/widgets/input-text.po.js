'use strict';

var _ = require('../../../tools/node_modules/lodash');

module.exports = {
  wrap: wrap,
  isVisible: isVisible,
  hasError: hasError,
  addText: addText,
  clear: clear,
  value: value
};

function wrap(element) {
  // Element should be the input 'form group'
  return {
    isVisible: _.partial(isVisible, element),
    hasError: _.partial(hasError, element),
    addText: _.partial(addText, element),
    clear: _.partial(clear, element),
    value: _.partial(value, element)
  };
}

function isVisible(element) {
  return element.element(by.css('input')).isVisible();
}

function hasError(element) {
  return element.getAttribute('class').then(function (classes) {
    return classes.split(' ').indexOf('has-error') < 0;
  });
}

function addText(element, keys) {
  return element.element(by.css('input')).sendKeys(keys);
}

function clear(element) {
  return element.element(by.css('input')).clear();
}

function value(element) {
  return element.element(by.css('input #inner-editor')).getText();
}
