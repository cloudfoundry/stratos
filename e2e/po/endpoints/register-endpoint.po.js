(function () {
  'use strict';

  var _ = require('../../../tools/node_modules/lodash');
  var Q = require('../../../tools/node_modules/q');
  var wizard = require('../widgets/wizard.po');

  module.exports = {
    isVisible: isVisible,
    getStep: getStep,
    getStepTwoType: getStepTwoType,
    selectType: selectType,
    close: close,
    safeClose: safeClose,
    populateAndRegister: populateAndRegister,
    getClose: getClose,
    closeEnabled: closeEnabled,
    getRegister: getRegister,
    registerEnabled: registerEnabled,
    enterAddress: enterAddress,
    isAddressValid: isAddressValid,
    clearAddress: clearAddress,
    enterName: enterName,
    isNameValid: isNameValid,
    clearName: clearName,
    setSkipSllValidation: setSkipSllValidation,
    checkError: checkError
  };

  function _getWizard() {
    return element(by.css('.register-service-wizard'));
  }

  function isVisible() {
    return _getWizard().isDisplayed();
  }

  function _getStepTitle() {
    return _getWizard().element(by.css('.register-content-right > h4'));
  }

  function getStep() {
    return _getStepTitle().getText().then(function (text) {
      text = text.trim();
      if (text.indexOf('Select an Endpoint Type') === 0) {
        return 1;
      } else if (text.indexOf('Register a') === 0) {
        return 2;
      }
      return -1;
    });
  }

  function selectType(type) {
    var registerButtons = _getWizard().all(by.css('.btn.btn-sm.btn-link'));
    switch (type) {
      case 'hcf':
        return registerButtons.get(0).click();
      case 'hce':
        return registerButtons.get(1).click();
      default:
        fail('Cannot select known type: ', type);
        break;
    }
  }

  function getStepTwoType() {
    return _getStepTitle().getText().then(function (text) {
      text = text.trim();

      switch (text) {
        case 'Register a Helion Cloud Foundry Endpoint':
          return 'hcf';
        case 'Register a Helion Code Engine Endpoint':
          return 'hce';
        default:
          fail('Unknown endpoint type: ', text);
          break;
      }
    });
  }

  function close() {
    return getClose().click();
  }

  function safeClose() {
    var close = safeGetClose();
    return close.then(function (button) {
      if (!button) {
        return protractor.promise.fulfilled();
      }
      return button.click();
    });
  }

  function getClose() {
    return wizard.getCancel(_getWizard());
  }

  function safeGetClose() {
    var modalButtons = element.all(by.css('.detail-view-close'));
    return modalButtons.count().then(function (count) {
      return count > 0 ? modalButtons.get(0) : null;
    });
  }

  function closeEnabled(shouldBeEnabled) {
    expect(getClose().isEnabled()).toBe(shouldBeEnabled);
  }

  function register() {
    var button = getRegister();
    expect(button.isEnabled()).toBeTruthy();

    return button.click();
  }

  function getRegister() {
    return wizard.getNext(_getWizard());
  }

  function registerEnabled(shouldBeEnabled) {
    expect(getRegister().isEnabled()).toBe(shouldBeEnabled);
  }

  function populateAndRegister(address, name, skipValidation) {
    return enterAddress(address)
      .then(function () {
        return enterName(name);
      })
      .then(function () {
        return setSkipSllValidation(skipValidation);
      })
      .then(register);
  }

  function _getInputAddress() {
    return _getWizard().element(by.model('wizardCtrl.options.userInput.url'));
  }

  function enterAddress(address) {
    return _getInputAddress().sendKeys(address);
  }

  function isAddressValid(required) {
    return _getInputAddress().getAttribute('class').then(function (inputClass) {
      var match = inputClass.split(' ').indexOf('ng-valid');
      if (required) {
        expect(match).not.toBe(-1);
      } else {
        expect(match).toBe(-1);
      }
    });
  }

  function clearAddress() {
    return _getInputAddress().clear();
  }

  function _getInputName() {
    return element(by.model('wizardCtrl.options.userInput.name'));
  }

  function enterName(name) {
    return _getInputName().sendKeys(name);
  }

  function isNameValid() {
    return _getInputName().getAttribute('class').then(function (inputClass) {
      return inputClass.indexOf('ng-valid') >= 0;
    });
  }

  function clearName() {
    return _getInputName().clear();
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
    return element(by.model('wizardCtrl.options.userInput.skipSslValidation'));
  }

  /**
   * @description Look for an error matching the passed RegExp or string
   * @param {Object} matchStringOrRegex a string or RegExp that will be compared against
   * the text contents of the error box
   * @returns {Object} a promise that will be resolved if the matching error is found
   * or rejected if not
   * */
  function checkError(matchStringOrRegex) {

    var testMatch;
    if (_.isRegExp(matchStringOrRegex)) {
      testMatch = function (testString) {
        return matchStringOrRegex.test(testString);
      };
    } else {
      testMatch = function (testString) {
        return matchStringOrRegex === testString;
      };
    }

    return element(by.css('.alert.alert-danger')).getText().then(function (errorText) {
      if (testMatch(errorText)) {
        return;
      }
      return Q.reject('Error with message matching ' + matchStringOrRegex + ' not found.' +
        ' We found the following errors instead: ' + errorText);
    });
  }

})();
