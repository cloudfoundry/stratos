(function () {
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

  function addService(serviceName) {
    var matchingService = getServices().filter(function (elem) {
      return elem.element(by.css('.service-text > h4')).getText().then(function (text) {
        return text === serviceName;
      });
    }).first();
    return matchingService.element(by.css('.btn.btn-sm.btn-link')).click();
  }

  function getServiceWizard() {
    return serviceWizard;
  }

})();
