'use strict';

var _ = require('../../../tools/node_modules/lodash');
var Q = require('../../../tools/node_modules/q');

module.exports = {
  wrap: wrap,
  isDisplayed: isDisplayed,
  addText: addText,
  clear: clear,
  getValue: getValue,
  getOptionsCount: getOptionsCount,
  getOptions: getOptions,
  selectOption: selectOption,
  selectOptionByLabel: selectOptionByLabel,
  open: open
};

function wrap(element) {
  // Element should be the element with 'form group'
  return {
    isDisplayed: _.partial(isDisplayed, element),
    addText: _.partial(addText, element),
    clear: _.partial(clear, element),
    getValue: _.partial(getValue, element),
    getOptionsCount: _.partial(getOptionsCount, element),
    getOptions: _.partial(getOptions, element),
    selectOption: _.partial(selectOption, element),
    selectOptionByLabel: _.partial(selectOptionByLabel, element),
    open: _.partial(open, element)
  };
}

function isDisplayed(element) {
  return element.element(by.css('search-box')).isDisplayed();
}

function addText(element, keys) {
  return element.element(by.css('input')).sendKeys(keys);
}

function clear(element) {
  return element.element(by.css('input')).clear();
}

function getValue(element) {
  return getOptions(element)
    .filter(function (elem) {
      return elem.getAttribute('class').then(function (classes) {
        return classes.indexOf('selected') >= 0;
      });
    })
    .first()
    .getAttribute('innerText')
    .then(function (text) {
      return text.trim();
    });
}

function getOptionsCount(element) {
  // This includes the 'all' option
  return getOptions(element).count();
}

function getOptions(element) {
  // This includes the 'all' option
  return element.all(by.css('.dropdown-menu li'));
}

function selectOption(element, index) {
  return open(element)
    .then(function () {
      return getOptions(element).get(index).click();
    })
    .then(function () {
      // Allow some time for the action, which probably contains a backend request, to execute
      return browser.driver.sleep(1000);
    });
}

function selectOptionByLabel(element, label) {
  return open(element)
    .then(function () {
      return getOptions(element)
        .filter(function (elem) {
          return elem.getAttribute('innerText')
            .then(function (text) {
              return text.trim();
            })
            .then(function (text) {
              return text === label;
            });
        })
        .first();
    })
    .then(function (elem) {
      return elem.click();
    })
    .then(function () {
      // Allow some time for the action, which probably contains a backend request, to execute
      return browser.driver.sleep(1000);
    });
}

function open(element) {
  expect(element.isDisplayed()).toBe(true);
  return element.element(by.css('input')).click();
}
