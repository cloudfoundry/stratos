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
      scope: {
        tabs: '='
      },
      templateUrl: 'plugins/cloud-foundry/view/util/cf-tabs/cf-tabs.html'
    };
  }

})();
