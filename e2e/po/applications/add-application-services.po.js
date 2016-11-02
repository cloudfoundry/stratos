'use strict';

var serviceWizard = require('./add-service-wizard.po');

module.exports = {
  getServices: getServices,
  addService: addService,
  getServiceWizard: getServiceWizard
};

function getServices() {
  return element.all(by.css('.wizard-step service-card'));
}

function addService(index) {
  return getServices().get(index).element(by.css('.btn.btn-sm.btn-link')).click();
}

function getServiceWizard() {
  return serviceWizard;
}
