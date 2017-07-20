(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications.application')
    .factory('cfApplicationTabs', ApplicationTabs);

  /**
   * @name cfApplicationTabs
   * @description Provides collection of configuration objects for tabs on the application page
   * @param {object} $q - the Angular $q service
   * @param {object} cfClusterTabs - the core cf tabs service
   * @returns {object} The cfApplicationTabs object
   */
  function ApplicationTabs(cfClusterTabs) {
    var service = {
      tabs: cfClusterTabs.applicationTabs,
      clearState: clearState,
      appUpdated: appUpdated,
      appDeleting: appDeleting,
      appDeleted: appDeleted
    };

    return service;

    function clearState() {
      return cfClusterTabs.callTabs([service.tabs], 'clearState');
    }

    function appUpdated(cnsiGuid, refresh) {
      return cfClusterTabs.callTabs([service.tabs], 'appUpdated', cnsiGuid, refresh);
    }

    function appDeleting() {
      return cfClusterTabs.callTabs([service.tabs], 'appDeleting');
    }

    function appDeleted() {
      return cfClusterTabs.callTabs([service.tabs], 'appDeleted');
    }

  }

})();
