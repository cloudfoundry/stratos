(function () {
  'use strict';
  var wizard = require('../../../../../app-core/frontend/test/e2e/po/widgets/wizard.po');

  module.exports = {
    isDisplayed: isDisplayed,
    getElement: getElement,
    getWizard: getWizard,
    getTitle: getTitle
  };

  function isDisplayed() {
    return getElement().isDisplayed();
  }

  function getElement() {
    return element(by.css('add-app-workflow'));
  }

  function getWizard() {
    return wizard.wrap(getElement());
  }

  function getTitle() {
    return element(by.css('add-app-workflow .wizard-head h4')).getText();
  }
})();
