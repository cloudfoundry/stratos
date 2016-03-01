(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.hosts', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.workspaces', {
      url: '/workspaces',
      templateUrl: 'plugins/cloud-foundry/view/hosts/hosts.html'
    });
  }

})();
