(function () {
  'use strict';

  var inputText = require('../../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var wizard = require('../../../../../app-core/frontend/test/e2e/po/widgets/wizard.po');

  module.exports = {
    getSelectedAddServiceTab: getSelectedAddServiceTab,
    getCreateNewName: getCreateNewName,
    getWizard: getWizard
  };

  function getElement() {
    return element(by.css('.add-service-workflow'));
  }

  function getSelectedAddServiceTab() {
    return getElement().element(by.css('.nav.nav-tabs .active a')).getText();
  }

  function getCreateNewName() {
    return inputText.wrap(getElement().all(by.css('.tab-pane.active .form-group')).get(0));
  }

  function getWizard() {
    return wizard.wrap(getElement());
  }
})();
