'use strict';

var _ = require('../../../tools/node_modules/lodash');

module.exports = {
  wrap: wrap,
  isVisible: isVisible,
  hasError: hasError,
  addText: addText,
  clear: clear,
  getValue: getValue
};

function wrap(element) {
  // Element should be the input 'form group'
  return {
    isVisible: _.partial(isVisible, element),
    hasError: _.partial(hasError, element),
    addText: _.partial(addText, element),
    clear: _.partial(clear, element),
    getValue: _.partial(getValue, element)
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

function getValue(element) {
  // Actual text is inside a shadow root, unable to use getText
  return element.element(by.css('input')).getAttribute('value');
}
