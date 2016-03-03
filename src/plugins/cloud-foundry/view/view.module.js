(function () {
  'use strict';

  angular
    .module('cloud-foundry.view', [
      'cloud-foundry.view.organizations',
      'cloud-foundry.view.applications',
      'cloud-foundry.view.workspace',
      'cloud-foundry.view.services'
    ])
    .config(registerRoute);

  registerRoute.$inject = [
    '$stateProvider'
  ];

  function registerRoute($stateProvider) {
    $stateProvider.state('cf', {
      url: 'cf',
      templateUrl: 'plugins/cloud-foundry/view/view.html'
    });
  }

})();
