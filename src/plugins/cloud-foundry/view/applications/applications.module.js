(function () {
  'use strict';

  angular
    .module('cloud-foundry.view.applications', [])
    .constant('cloud-foundry.view.applications.basePath',
              env.plugins.cloudFoundry.basePath + 'view/applications/')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.view.applications.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf.applications', {
      url: '/applications',
      templateUrl: basePath + 'applications.html'
    });
  }

})();
