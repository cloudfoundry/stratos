(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .factory('cfApplicationTabs', ApplicationTabs);

  /**
   * @name cfApplicationTabs
   * @description Provides collection of configuration objects for tabs on the application page
   * @param {object} cfTabs - the core cf tabs service
   * @returns {object} The cfApplicationTabs object
   */
  function ApplicationTabs(cfTabs) {
    var service = {
      tabs: cfTabs.applicationTabs,
      clearState: clearState,
      appUpdated: appUpdated,
      appDeleting: appDeleting,
      appDeleted: appDeleted
    };

    return service;

    function clearState() {
      return cfTabs.callTabs([service.tabs], 'clearState');
    }

    function appUpdated(cnsiGuid, refresh) {
      return cfTabs.callTabs([service.tabs], 'appUpdated', cnsiGuid, refresh);
    }

    function appDeleting() {
      return cfTabs.callTabs([service.tabs], 'appDeleting');
    }

    function appDeleted() {
      return cfTabs.callTabs([service.tabs], 'appDeleted');
    }

  }

})();
