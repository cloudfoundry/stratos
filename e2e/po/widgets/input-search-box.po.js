'use strict';

var _ = require('../../../tools/node_modules/lodash');

module.exports = {
  wrap: wrap,
  isVisible: isVisible,
  addText: addText,
  clear: clear,
  value: value
};

function wrap(element) {
  // Element should be the input 'form group'?????????????????????????????????????????????????
  return {
    isVisible: _.partial(isVisible, element),
    addText: _.partial(addText, element),
    clear: _.partial(clear, element),
    value: _.partial(value, element)
  };
}

function isVisible(element) {
  return element.element(by.css('search-box')).isVisible();
}

function addText(element, keys) {
  return element.element(by.css('input')).sendKeys(keys);
}

function clear(element) {
  return element.element(by.css('input')).clear();
}

function value(element) {
  return element.element(by.css('input #placeholder')).getText();
}
