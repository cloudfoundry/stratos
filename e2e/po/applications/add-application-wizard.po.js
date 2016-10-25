'use strict';

// var navbar = require('./navbar.po');
var inputText = require('../widgets/input-text.po');
var inputSearchBox = require('../widgets/input-search-box.po');

module.exports = {
  isVisible: isVisible,
  wizard: wizard,
  name: name,
  hcf: hcf,
  organization: organization,
  space: space,
  domain: domain,
  host: host
};

function isVisible() {
  return element(by.css('add-app-worflow')).isVisible();
}

function name() {
  return inputText.inputText(element.all(by.css('wizard-step').get(0)));
}

function hcf() {
  return inputSearchBox.wrap(element.all(by.css('wizard-step').get(1)));
}

function organization() {
  return inputSearchBox.wrap(element.all(by.css('wizard-step').get(2)));
}

function space() {
  return inputSearchBox.wrap(element.all(by.css('wizard-step').get(3)));
}

function domain() {
  return inputSearchBox.wrap(element.all(by.css('wizard-step').get(4)));
}

function host() {
  return inputText.wrap(element.all(by.css('wizard-step').get(5)));
}

