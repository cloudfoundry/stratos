(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.services', [])
    .constant('cloud-foundry.view.services.basePath',
              env.plugins.cloudFoundry.basePath + 'view/services/')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.view.services.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf.services', {
      url: '/services',
      templateUrl: basePath + 'services.html'
    });
  }

})();
