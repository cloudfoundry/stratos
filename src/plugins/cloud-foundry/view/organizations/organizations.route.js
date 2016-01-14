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
    $stateProvider.state('cf.organizations', {
      url: '/organizations',
      templateUrl: basePath + 'view/organizations/organizations.html'
    });
  }

})();
