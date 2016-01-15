(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.organizations', [])
    .constant('cloud-foundry.view.organizations.basePath',
              env.plugins.cloudFoundry.basePath + 'view/organizations/')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.view.organizations.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf.organizations', {
      url: '/organizations',
      templateUrl: basePath + 'organizations.html'
    });
  }
})();
