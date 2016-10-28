'use strict';

module.exports = {
  isDisplayed: isDisplayed,
  getElement: getElement
};

function isDisplayed() {
  return getElement().isDisplayed();
}

function getElement() {
  return element(by.css('add-app-workflow'));
}
