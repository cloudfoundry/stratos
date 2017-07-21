(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application.events', [])
    .config(registerRoute)
    .run(registerAppTab);

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.applications.application.events', {
      url: '/events',
      template: '<cf-events-table actee="appEventsCtrl.id"></cf-events-table>',
      controller: ApplicationEventsController,
      controllerAs: 'appEventsCtrl'
    });
  }

  function registerAppTab($stateParams, cfApplicationTabs) {
    cfApplicationTabs.tabs.push({
      position: 6,
      hide: function () {
        return false;
      },
      uiSref: 'cf.applications.application.events',
      uiSrefParam: function () {
        return {guid: $stateParams.guid};
      },
      label: 'app.app-info.app-tabs.events',
      clearState: function () {}
    });
  }

  /**
   * @name ApplicationEventsController
   * @constructor
   * @param {object} $stateParams - the UI router $stateParams service
   * @property {string} id - the application GUID
   */
  function ApplicationEventsController($stateParams) {
    var vm = this;
    vm.id = $stateParams.guid;
  }
})();
