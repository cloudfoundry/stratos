(function () {
  'use strict';

  var helpers = require('../../../../../../app-core/frontend/test/e2e/po/helpers.po');

  module.exports = {
    goToApp: goToApp,

    showSummary: showSummary,
    showLogView: showLogView,
    showServices: showServices,

    isNewlyCreated: isNewlyCreated,
    isIncomplete: isIncomplete,

    getHeaderAppName: getHeaderAppName,
    getActiveTab: getActiveTab,
    getTabs: getTabs,
    goToTab: goToTab,

    // Summary Tab
    addRoute: addRoute,
    editApplication: editApplication,

    // Service Instance Tab
    findServiceInstanceCard: findServiceInstanceCard,

    invokeAction: invokeAction

    // applicationServiceFlyout: applicationServiceFlyout,
    // showServiceDetails: showServiceDetails,
    // serviceAddConfirm: serviceAddConfirm,
    // servicePanelsAddServiceButtons: servicePanelsAddServiceButtons

  };

  function goToApp(clusterGuid, appGuid) {
    var url = helpers.getHost() + '/#!/cf/applications/' + clusterGuid + '/app/' + appGuid + '/summary';
    return browser.get(url)
      .then(function () {
        return browser.getCurrentUrl();
      })
      .then(function (actualUrl) {
        return expect(actualUrl).toBe(url);
      });
  }

  function showSummary() {
    applicationAction(0).click();
  }

  function showLogView() {
    applicationAction(1).click();
  }

  function showServices() {
    applicationAction(2).click();
  }

  function goToTab(index) {
    return applicationAction(index).click();
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

  function getHeaderAppName() {
    return element(by.css('.application-header .app-header-app-name'));
  }

  function isIncomplete() {
    return element(by.css('app-state-icon .app-status.app-status-icon-warning')).isDisplayed();
  }

  function getActiveTab() {
    return element(by.css('ul.application-nav.nav > li.nav-item.active > a'));
  }

  function getTabs() {
    return element.all(by.css('ul.application-nav.nav > li.nav-item > a'))
      .filter(function (elem) {
        return elem.isDisplayed();
      });
  }

  function addRoute() {
    return element(by.css('.summary-routes .action-header a.btn.btn-link')).click();
  }

  function editApplication() {
    return element(by.css('.summary .action-header a.btn.btn-link')).click();
  }

  function findServiceInstanceCard(name) {
    var cards = element.all(by.css('.services-gallery-card__container'));
    var matchingService = cards.filter(function (elem) {
      return elem.element(by.css('.gallery-card-title')).getText().then(function (text) {
        return text === name;
      });
    }).first();

    return matchingService;
  }

  function invokeAction(actionName) {
    var actions = element.all(by.css('.application-header .actions-toolbar > button > span'));
    var matchingAction = actions.filter(function (elem) {
      return elem.getText().then(function (text) {
        return text === actionName;
      });
    }).first();
    return matchingAction.click();
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
