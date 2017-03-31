(function () {
  'use strict';

  var _ = require('../../../tools/node_modules/lodash');

  module.exports = {
    wrap: wrap,
    isDisplayed: isDisplayed,
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
      getValue: _.partial(getValue, element),
      getOptionsCount: _.partial(getOptionsCount, element),
      getOptions: _.partial(getOptions, element),
      selectOption: _.partial(selectOption, element),
      selectOptionByLabel: _.partial(selectOptionByLabel, element),
      open: _.partial(open, element)
    };
  }

  function isDisplayed(element) {
    return element.element(by.css('select-input')).isDisplayed();
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
      });
  }

  function open(element) {
    expect(element.isDisplayed()).toBe(true);
    return element.element(by.css('select-input')).click();
  }
})();
