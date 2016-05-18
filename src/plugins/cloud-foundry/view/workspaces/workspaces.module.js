(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.workspaces', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.workspaces', {
      url: '/workspaces',
      templateUrl: 'plugins/cloud-foundry/view/workspaces/workspaces.html',
      data: {
        activeMenuState: 'cf.workspaces'
      }
    });
  }

})();
