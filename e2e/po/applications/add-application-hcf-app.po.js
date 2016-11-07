'use strict';

var inputText = require('../widgets/input-text.po');
var inputSearchBox = require('../widgets/input-search-box.po');
var addAppWizard = require('../applications/add-application-wizard.po');

module.exports = {
  name: name,
  hcf: hcf,
  organization: organization,
  space: space,
  domain: domain,
  host: host
};

function name() {
  return inputText.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(0));
}

function hcf() {
  return inputSearchBox.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(1));
}

function organization() {
  return inputSearchBox.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(2));
}

function space() {
  return inputSearchBox.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(3));
}

function domain() {
  return inputSearchBox.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(4));
}

function host() {
  return inputText.wrap(addAppWizard.getElement().all(by.css('.form-group')).get(5));
}
