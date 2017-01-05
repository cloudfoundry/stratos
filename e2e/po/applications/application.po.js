(function () {
  'use strict';

  module.exports = {

    showSummary: showSummary,
    showLogView: showLogView,
    showServices: showServices,
    showDeliveryPipeline: showDeliveryPipeline,
    showDeliveryLogs: showDeliveryLogs,

    isNewlyCreated: isNewlyCreated,
    isIncomplete: isIncomplete,

    getHeader: getHeader,
    getActiveTab: getActiveTab,
    getTabs: getTabs

    // applicationServiceFlyout: applicationServiceFlyout,
    // showServiceDetails: showServiceDetails,
    // serviceAddConfirm: serviceAddConfirm,
    // servicePanelsAddServiceButtons: servicePanelsAddServiceButtons

  };

  function showSummary() {
    applicationAction(0).click();
  }

  function showLogView() {
    applicationAction(1).click();
  }

  function showServices() {
    applicationAction(2).click();
  }

  function showDeliveryPipeline() {
    applicationAction(3).click();
  }

  function showDeliveryLogs() {
    applicationAction(4).click();
  }

  function applicationActionsBar() {
    return element.all(by.css('ul.nav.nav-tabs li a'));
  }

  function applicationAction(idx) {
    return applicationActionsBar().get(idx);
  }

  function isNewlyCreated() {
    return element(by.id('new-app-panel')).isDisplayed();
  }

  function getHeader() {
    return element(by.css('.application-header'));
  }

  function isIncomplete() {
    return element(by.css('app-state-icon .app-status.helion-icon-Warning_S')).isDisplayed();
  }

  function getActiveTab() {
    return element(by.css('ul.application-nav.nav > li.nav-item.active > a'));
  }

  function getTabs() {
    return element.all(by.css('ul.application-nav.nav > li.nav-item > a'));
  }

})();

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
