'use strict';

var navbar = require('./navbar.po');
var helpers = require('../po/helpers.po');

module.exports = {
  isVisible: isVisible,
  getEndpointType: getEndpointType,
  close: close,
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
  setSkipSllValidation: setSkipSllValidation
};

function isVisible() {
  return element(by.css('.registration-form')).isDisplayed();
}

function getEndpointType() {
  return element(by.css('.detail-view-header')).getText().then(function (headerText) {
    switch (headerText) {
      case 'Register Helion Cloud Foundry':
        return 'hcf';
      case 'Register Helion Code Engine':
        return 'hce';
      default:
        fail('Unrecognised tile of register endpoint (neither hce or hcf): ' + headerText);
        break;
    }
  });
}

function close() {
  return getClose().then(function (button) {
    return button.click().then(function () {
      // Allow time for animation to finish.. otherwise future clicks will be swallowed by glass background
      return browser.driver.sleep(1000);
    });
  });
}

function getClose() {
  return element.all(by.css('.modal-footer > button')).then(function (buttons) {
    return buttons[0];
  });
}

function closeEnabled(shouldBeEnabled) {
  return getClose().then(function (button) {
    expect(button.isEnabled()).toBe(shouldBeEnabled);
  });
}

function register() {
  return getRegister().then(function (button) {
    expect(button.isEnabled()).toBeTruthy();

    return button.click().then(function () {
      // Allow time for animation to finish.. otherwise future clicks will be swallowed by glass background
      return browser.driver.sleep(1000);
    });
  });
}

function getRegister() {
  return element.all(by.css('.modal-footer > button')).then(function (buttons) {
    return buttons[1];
  });
}

function registerEnabled(shouldBeEnabled) {
  return getRegister().then(function (button) {
    expect(button.isEnabled()).toBe(shouldBeEnabled);
  });
}

function populateAndRegister(address, name, skipValidation) {
  return enterAddress(address)
    .then(function () {
      return enterName(name);
    })
    .then(function () {
      return setSkipSllValidation(skipValidation);
    })
    .then(register)
    .then(function () {
      return browser.driver.sleep(2000);
    });
}

function _getInputAddress() {
  return element(by.model('asyncTaskDialogCtrl.context.data.url'));
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
  return element(by.model('asyncTaskDialogCtrl.context.data.name'));
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
  return element(by.model('asyncTaskDialogCtrl.context.data.skipSslValidation'));
}
