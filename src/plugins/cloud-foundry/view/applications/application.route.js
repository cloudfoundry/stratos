(function () {
  'use strict';

  angular
    .module('cloud-foundry')
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider',
    'cloud-foundry.basePath'
  ];

  function registerRoute($stateProvider, basePath) {
    $stateProvider.state('cf.applications', {
      url: 'applications/',
      templateUrl: basePath + 'view/applications/applications.html'
    });
  }

})();
