(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.hosts', [])
    .constant('cloud-foundry.view.hosts.basePath',
              env.plugins.cloudFoundry.basePath + 'view/hosts/')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.view.hosts.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf.hosts', {
      url: '/hosts',
      templateUrl: basePath + 'hosts.html'
    });
  }

})();
