'use strict';

var navbar = require('../navbar.po');

module.exports = {

  showServices: showServices,
  showDeliveryLogs: showDeliveryLogs

  // applicationServiceFlyout: applicationServiceFlyout,
  // showServiceDetails: showServiceDetails,
  // serviceAddConfirm: serviceAddConfirm,
  // servicePanelsAddServiceButtons: servicePanelsAddServiceButtons

};

function showServices() {
  applicationAction(2).click();
}

function showDeliveryLogs() {
  applicationAction(3).click();
}

function applicationActionsBar() {
  return element.all(by.css('ul.nav.nav-tabs li a'));
}

function applicationAction(idx) {
  return applicationActionsBar().get(idx);
}

// function servicePanelsAddServiceButtons() {
//   return element.all(by.css('div.service-panel div.service-actions button'));
// }

// function servicePanelsAddServiceButton(idx) {
//   return servicePanelsAddServiceButtons().get(idx);
// }
//
// function serviceDetailsActions() {
//   return element.all(by.css('div.service-detail-actions button'));
// }

// function serviceDetailsAction(idx) {
//   return serviceDetailsActions().get(idx);
// }

// function showServiceDetails() {
//   servicePanelsAddServiceButton(0).click();
//   browser.driver.sleep(1000);
// }

// function serviceDetailsAddAction() {
//   return serviceDetailsAction(1);
// }
//
// function serviceDetailsCancelAction() {
//   return serviceDetailsAction(0);
// }

// function applicationServiceFlyout() {
//   return element(by.css('add-service-workflow'));
// }

// function serviceAddConfirm() {
//   serviceDetailsAddAction().click();
// }
//
// function serviceAddCancel() {
//   serviceDetailsCancelAction().click();
// }
