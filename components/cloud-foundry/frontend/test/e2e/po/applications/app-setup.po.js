(function () {
  'use strict';

  var wizard = require('../../../../../../app-core/frontend/test/e2e/po/widgets/wizard.po');
  var inputText = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-text.po');
  var searchBox = require('../../../../../../app-core/frontend/test/e2e/po/widgets/input-search-box.po');
  
  module.exports = {
    getWizard: getWizard,
    getStepTitle: getStepTitle,
    uaaApiUrl: uaaApiUrl,
    setSkipSllValidation: setSkipSllValidation,
    clientId: clientId,
    clientSecret: clientSecret,
    adminUserName: adminUserName,
    adminPassword: adminPassword,
    scopeSearchBox: scopeSearchBox
  };

  function getWizard() {
    return wizard.wrap(element(by.css('.app-setup-wizard')));
  }

  function getStepTitle() {
    return getWizard().getCurrentStepName();
  }

  function uaaApiUrl() {
    return inputText.wrap(element.all(by.css('.form-group')).get(0));
  }

  function setSkipSllValidation(checked) {
    var checkbox = _getSkipSllValidation();
    var checkIndicator = checkbox.element(by.css('.checkbox-input.checked'));

    return checkIndicator.isPresent().then(function (present) {
      if (!present && checked) {
        return checkbox.click();
      } else if (present && !checked) {
        return checkbox.click();
      }
    });
  }

  function _getSkipSllValidation() {
    return element(by.css('.skip-ssl-validation-checkbox'));
  }

  function clientId() {
    return inputText.wrap(element.all(by.css('.form-group')).get(2));
  }

  function clientSecret() {
    return inputText.wrap(element.all(by.css('.form-group')).get(3));
  }

  function adminUserName() {
    return inputText.wrap(element.all(by.css('.form-group')).get(4));
  }

  function adminPassword() {
    return inputText.wrap(element.all(by.css('.form-group')).get(5));
  }

  function scopeSearchBox() {
    return searchBox.wrap(element(by.css('.form-group.console-scopes')));
  }

})();