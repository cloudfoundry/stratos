(function () {
  'use strict';

  var serviceWizard = require('./add-service-wizard.po');

  module.exports = {
    getServices: getServices,
    addService: addService,
    getServiceWizard: getServiceWizard
  };

  function getServices() {
    return element.all(by.css('service-catalogue-card'));
  }

  function addService(serviceName) {
    var matchingService = getServices().filter(function (elem) {
      return elem.element(by.css('.service-text > h4')).getText().then(function (text) {
        return text === serviceName;
      });
    }).first();

    var btn = getButton(matchingService, 'Add Service');
    btn.click();
  }

  function getButton(serviceCatalogCard, buttonText) {
    var buttons = serviceCatalogCard.all(by.css('.service-actions > button'));
    return buttons.filter(function (elem) {
      return elem.getText().then(function (text) {
        return text.toLowerCase().indexOf(buttonText.toLowerCase()) === 0;
      });
    }).first();
  }

  function getServiceWizard() {
    return serviceWizard;
  }

})();
