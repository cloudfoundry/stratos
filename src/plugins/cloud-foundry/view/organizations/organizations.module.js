(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.organizations', [])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf.organizations', {
      url: '/organizations',
      templateUrl: 'plugins/cloud-foundry/view/organizations/organizations.html'
    });
  }
})();
