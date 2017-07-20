(function () {
  'use strict';

  angular
    .module('cloud-foundry.view')
    .directive('cfTabs', cfTabs);

  /**
   * @name cfTabs
   * @returns {object} The cfTabs directive definition object
   */
  function cfTabs() {
    return {
      bindToController: {
        tabs: '='
      },
      controller: CFTabs,
      controllerAs: 'cfTabs',
      templateUrl: 'plugins/cloud-foundry/view/util/cf-tabs/cf-tabs.html'
    };
  }

  /**
   * @name CFTabs
   * @constructor
   * @param {object} $stateParams - the ui-router $stateParams service
   * @param {object} modelManager - the model manager service
   * @param {app.framework.widgets.frameworkDetailView} frameworkDetailView frameworkDetailView
   */
  function CFTabs($stateParams, modelManager, frameworkDetailView) {
    var vm = this;

  }
})();
